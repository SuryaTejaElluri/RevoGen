import { Module } from '@nestjs/common';

import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';

import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AnalysisModule } from '../analysis/analysis.module';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    AnalysisModule,
  ],
  controllers: [ResumesController],
  providers: [ResumesService],
})
export class ResumesModule {}