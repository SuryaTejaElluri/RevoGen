import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ResumesModule } from './resumes/resumes.module';
import { AnalysisModule } from './analysis/analysis.module';
import { TestsModule } from './tests/tests.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { QuestionBankModule } from './question-bank/question-bank.module';


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
    QuestionBankModule,
  ],
})
export class AppModule {}