import { Body, Controller, Post, Param, Get} from '@nestjs/common';
import { TestsService } from './tests.service';
import { UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/admin.guard';
@Controller('tests')
export class TestsController {
  constructor(
    private readonly testsService: TestsService,
  ) {}

  

@UseGuards(
  AuthGuard('jwt'),
  AdminGuard,
)
@Post()
createTest(
  @Body() body: any,
) {
  return this.testsService.createTest(
    body,
  );
}

@Post(':id/questions')
addQuestion(
  @Param('id') id: string,
  @Body() body: any,
) {
  return this.testsService.addQuestion(id, body);
}

@Get('assigned')
@UseGuards(AuthGuard('jwt'))
getAssignedTests(
  @Request() req,
) {
  console.log(
    'USER:',
    req.user,
  );

  return this.testsService.getAssignedTests(
    req.user.email,
  );
}
@Get(':id/results')
@UseGuards(
  AuthGuard('jwt'),
  AdminGuard,
)
getResults(
  @Param('id') id: string,
) {
  return this.testsService.getResults(
    id,
  );
}
@Get('practice')
getPracticeTests() {
  return this.testsService.getPracticeTests();
}
@Get('my-attempts')
@UseGuards(AuthGuard('jwt'))
getMyAttempts(
  @Request() req,
) {
  return this.testsService.getUserAttempts(
    req.user.userId,
  );
}
@Get(':id/invitations')
@UseGuards(
  AuthGuard('jwt'),
  AdminGuard,
)
getInvitations(
  @Param('id') id: string,
) {
  return this.testsService.getInvitations(
    id,
  );
}
@Get(':id/attempt-status')
@UseGuards(AuthGuard('jwt'))
getAttemptStatus(
  @Param('id') id: string,
  @Request() req,
) {
  return this.testsService.hasAttempted(
    id,
    req.user.userId,
  );


}

@Get(':id/modules')
@UseGuards(
  AuthGuard('jwt'),
  AdminGuard,
)
getModules(
  @Param('id') id: string,
) {
  return this.testsService.getModules(
    id,
  );
}

@Get('dashboard/stats')
@UseGuards(
  AuthGuard('jwt'),
  AdminGuard,
)
getDashboardStats() {
  return this.testsService.getDashboardStats();
}

@Get(':id')
findById(
  @Param('id') id: string,
) {
  return this.testsService.findById(id);
}

@UseGuards(AuthGuard('jwt'))
@Post(':id/submit')
submitTest(
  @Param('id') id: string,

  @Body() body: any,

  @Request() req,
) {
  return this.testsService.submitTest(
  id,
  req.user.userId,
  body.answers,
  body,
);
}



@Get()
findAll() {
  return this.testsService.findAll();
}

@Post(
  ':testId/questions-bank/:questionId',
)
@UseGuards(
  AuthGuard('jwt'),
  AdminGuard,
)
addQuestionFromBank(
  @Param('testId')
  testId: string,

  @Param('questionId')
  questionId: string,
) {
  return this.testsService
    .addQuestionFromBank(
      testId,
      questionId,
    );
}
@Post(':id/invite')
@UseGuards(
  AuthGuard('jwt'),
  AdminGuard,
)
inviteCandidates(
  @Param('id') id: string,

  @Body() body: {
    emails: string[];
  },
) {
  return this.testsService.inviteCandidates(
    id,
    body.emails,
  );
}

}