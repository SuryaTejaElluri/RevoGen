import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { FinalSubmitDto }
from './dto/final-submit.dto';
import { CreateSecurityEventDto }
from './dto/create-security-event.dto';
import { AdminGuard } from '../auth/admin.guard';
import {
  
  Request,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { CodingTestsService } from './coding-tests.service';

import { CreateCodingTestDto } from './dto/create-coding-test.dto';

import { UpdateCodingTestDto } from './dto/update-coding-test.dto';
import { StartAssessmentDto } from './dto/start-assessment.dto';
import { InviteCodingCandidatesDto } from './dto/invite-coding-candidates.dto';
@Controller('coding-tests')
export class CodingTestsController {
  constructor(
    private readonly codingTestsService: CodingTestsService,
  ) {}

@Get('assigned')
@UseGuards(AuthGuard('jwt'))
getAssignedCodingTests(
  @Request() req,
) {
  return this.codingTestsService.getAssignedCodingTests(
    req.user.email,
  );
}


 @UseGuards(AuthGuard('jwt'))
@Post()
create(
  @Body() dto: CreateCodingTestDto,
  @Request() req,
) {
  return this.codingTestsService.create(
    dto,
    req.user.userId,
  );
}

 @UseGuards(
  AuthGuard('jwt'),
  AdminGuard,
)
@Get()
findAll(
  @Request() req,
) {
  return this.codingTestsService.findAll(
    req.user.userId,
  );
}


@UseGuards(
  AuthGuard('jwt'),
  AdminGuard,
)
@Patch(':id')
update(
  @Param('id') id: string,
  @Body() dto: UpdateCodingTestDto,
  @Request() req,
) {
  return this.codingTestsService.update(
    id,
    dto,
    req.user.userId,
  );
}
@UseGuards(AuthGuard('jwt'))
@Get(':id/candidate')
getCandidateAssessment(
  @Param('id') id: string,
  @Request() req,
) {
  return this.codingTestsService.getCandidateAssessment(
    id,
    req.user.email,
  );
}

@UseGuards(
  AuthGuard('jwt'),
  AdminGuard,
)
@Delete(':id')
remove(
  @Param('id') id: string,
  @Request() req,
) {
  return this.codingTestsService.remove(
    id,
    req.user.userId,
  );
}


@UseGuards(AuthGuard('jwt'))
@Post('start')
startAssessment(
  @Body() dto: StartAssessmentDto,

  @Request() req,
) {
  return this.codingTestsService.startAssessment(
    dto,
    req.user.email,
  );
}


  @UseGuards(
  AuthGuard('jwt'),
  AdminGuard,
)
@Get(':id')
findOne(
  @Param('id') id: string,
  @Request() req,
) {
  return this.codingTestsService.findOne(
    id,
    req.user.userId,
  );
}
@UseGuards(AuthGuard('jwt'))
@Post('security-event')
   @Post('security-event')
  async logSecurityEvent(
    @Body() dto: CreateSecurityEventDto,
  ) {
    return this.codingTestsService.logSecurityEvent(dto);
  }


@UseGuards(AuthGuard('jwt'))
  @Post('final-submit')
async finalSubmit(
  @Body() dto: FinalSubmitDto,
) {
  return this.codingTestsService.finalSubmit(
    dto,
  );
}

@UseGuards(
  AuthGuard('jwt'),
  AdminGuard,
)
@Get('result/:attemptId')
getResult(
  @Param('attemptId')
  attemptId: string,

  @Request() req,
) {
  return this.codingTestsService.getResult(
    attemptId,
    req.user.userId,
  );
}

@UseGuards(
  AuthGuard('jwt'),
  AdminGuard,
)
@Get(':id/security-events')
getSecurityEvents(
  @Param('id') id: string,
  @Request() req,
) {
  return this.codingTestsService.getSecurityEvents(
    id,
    req.user.userId,
  );
}



@UseGuards(
  AuthGuard('jwt'),
  AdminGuard,
)
@Get(':id/attempts')
getAttempts(
  @Param('id') id: string,
  @Request() req,
) {
  return this.codingTestsService.getAttempts(
    id,
    req.user.userId,
  );
}

@UseGuards(AuthGuard('jwt'))
@Post(':id/invite')
inviteCandidates(
  @Param('id') id: string,

  @Body() dto: InviteCodingCandidatesDto,

  @Request() req,
) {
  return this.codingTestsService.inviteCandidates(
    id,
    dto,
    req.user.userId,
  );
}

@UseGuards(AuthGuard('jwt'))
@Get(':id/invitations')
getInvitations(
  @Param('id') id: string,

  @Request() req,
) {
  return this.codingTestsService.getInvitations(
    id,
    req.user.userId,
  );
}

}