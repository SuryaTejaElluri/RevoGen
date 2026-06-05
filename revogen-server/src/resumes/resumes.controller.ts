import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  Get,
  Param
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';

import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ResumesService } from './resumes.service';
import { AnalysisService } from '../analysis/analysis.service';

@Controller('resumes')
export class ResumesController {
  constructor(
  private cloudinaryService: CloudinaryService,
  private resumesService: ResumesService,
  private analysisService: AnalysisService,
) {}

  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('resume'))
  async uploadResume(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Req() req,
  ) {
    const uploaded =
      await this.cloudinaryService.uploadFile(
        file,
      );

    return this.resumesService.create({
      title,
      fileUrl: uploaded.secure_url,
      fileType: file.mimetype,
      userId: req.user.userId,
    });
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getResumes(@Req() req) {
    return this.resumesService.findAll(
      req.user.userId,
    );
  }
  @Get('test-analysis')
@UseGuards(AuthGuard('jwt'))
testAnalysis() {
  const sampleText = `
    Java Spring Boot React PostgreSQL Docker Git GitHub
  `;

  const skills =
    this.analysisService.extractSkills(
      sampleText,
    );

  return {
    skills,
  };
}
@Post(':id/analyze')
@UseGuards(AuthGuard('jwt'))
async analyzeResume(
  @Param('id') id: string,
) {
  const resume =
    await this.resumesService.findById(id);

  if (!resume) {
    return {
      message: 'Resume not found',
    };
  }

  const rawText =
    await this.analysisService.extractTextFromDocx(
      resume.fileUrl,
    );

  const skills =
    this.analysisService.extractSkills(
      rawText,
    );

    const ats =
  this.analysisService.calculateATS(
    skills,
  );

  const analysis =
  await this.resumesService.createAnalysis({
    resumeId: resume.id,
    skills,
    education: [],
    projects: [],
    rawText,

    atsScore: ats.atsScore,
    missingSkills: ats.missingSkills,
  });
  return analysis;
}
}