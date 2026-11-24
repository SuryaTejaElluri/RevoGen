import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  Get,
  Param,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';

import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ResumesService } from './resumes.service';
import { AnalysisService } from '../analysis/analysis.service';

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Controller('resumes')
export class ResumesController {
  constructor(
    private cloudinaryService: CloudinaryService,
    private resumesService: ResumesService,
    private analysisService: AnalysisService,
  ) {}

  @Get('roles')
  getRoles() {
    return this.analysisService.getRoles();
  }

  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('resume', { limits: { fileSize: MAX_RESUME_BYTES } }),
  )
  async uploadResume(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Req() req,
  ) {
    if (!file) throw new BadRequestException('Choose a resume file to upload.');
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Upload a PDF or Word (.docx) file.');
    }
    if (!title?.trim())
      throw new BadRequestException('Give your resume a title.');

    const uploaded = await this.cloudinaryService.uploadFile(file);

    return this.resumesService.create({
      title: title.trim(),
      fileUrl: uploaded.secure_url,
      fileType: file.mimetype,
      userId: req.user.userId,
    });
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getResumes(@Req() req) {
    return this.resumesService.findAll(req.user.userId);
  }

  @Post(':id/analyze')
  @UseGuards(AuthGuard('jwt'))
  async analyzeResume(
    @Param('id') id: string,
    @Req() req,
    @Body('roleId') roleId?: string,
    @Body('customJd') customJd?: string,
  ) {
    const usingJd = !!customJd && customJd.trim().length > 20;
    if (!usingJd && !this.analysisService.getRoleById(roleId)) {
      throw new BadRequestException('Choose the role you are applying for.');
    }

    // Only the owner can analyse a resume.
    const resume = await this.resumesService.findOwnedById(id, req.user.userId);
    if (!resume) throw new NotFoundException('Resume not found.');

    const rawText = await this.analysisService.extractText(
      resume.fileUrl,
      resume.fileType,
    );
    const detection = this.analysisService.detectSkills(rawText);
    const ats = this.analysisService.calculateATS(detection, roleId, customJd);

    const analysis = await this.resumesService.createAnalysis({
      resumeId: resume.id,
      skills: [...detection.found, ...detection.implied],
      education: [],
      projects: {
        targetRole: ats.targetRole,
        rating: ats.rating,
        coreMatched: ats.coreMatched,
        bonusMatched: ats.bonusMatched,
        bonusMissing: ats.bonusMissing,
        bonusTarget: ats.bonusTarget,
        impliedSkills: ats.impliedSkills,
        otherSkills: ats.otherSkills,
        coreMatchPercent: ats.coreMatchPercent,
        bonusMatchPercent: ats.bonusMatchPercent,
        tips: ats.tips,
      },
      rawText,
      atsScore: ats.atsScore,
      missingSkills: ats.coreMissing,
    });

    // rawText stays in the database; the client doesn't need it.
    const { rawText: _omit, ...rest } = analysis;
    return { ...rest, ...ats };
  }
}
