import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ResumesModule } from './resumes/resumes.module';
import { AnalysisModule } from './analysis/analysis.module';
import { TestsModule } from './tests/tests.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { QuestionBankModule } from './question-bank/question-bank.module';
import { Judge0Module } from './judge0/judge0.module';

import { CodingQuestionBankModule } from './coding-question-bank/coding-question-bank.module';

import { CodingTestsModule } from './coding-tests/coding-tests.module';

import { CodingAttemptsModule } from './coding-attempts/coding-attempts.module';
import { CodingSubmissionsModule }
from './coding-submissions/coding-submissions.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      
    }),
    

    AuthModule,
    UsersModule,
    ResumesModule,
    AnalysisModule,
    TestsModule,
    DashboardModule,
QuestionBankModule ,
    Judge0Module,

    CodingQuestionBankModule,

    CodingTestsModule,

    CodingAttemptsModule,
    CodingSubmissionsModule,
  ],
})
export class AppModule {}