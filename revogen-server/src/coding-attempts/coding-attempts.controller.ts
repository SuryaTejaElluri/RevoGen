import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { CodingAttemptsService } from './coding-attempts.service';

import { CreateSecurityEventDto }
from './dto/create-security-event.dto';

@Controller('coding-attempts')
export class CodingAttemptsController {
  constructor(
    private readonly codingAttemptsService: CodingAttemptsService,
  ) {}



  @UseGuards(AuthGuard('jwt'))
  @Post('start/:codingTestId')
  startTest(
    @Param('codingTestId')
    codingTestId: string,

    @Request()
    req,
  ) {
    return this.codingAttemptsService.startTest(
      codingTestId,
      req.user.userId,
    );
  }


@UseGuards(AuthGuard('jwt'))
  @Get(':attemptId')
async getAttempt(
    
  @Param('attemptId') attemptId: string,
  
  @Request() req,
  
) {
    console.log("REQ USER:", req.user);
  const result =
    await this.codingAttemptsService.getAttempt(
      attemptId,
      req.user.userId,
    );

  console.log(
    'GET ATTEMPT RESULT:',
    JSON.stringify(result, null, 2),
  );
  

  return result;
}

  @UseGuards(AuthGuard('jwt'))
  @Post(':attemptId/submit')
  submitAttempt(
    @Param('attemptId')
    attemptId: string,

    @Request()
    req,
  ) {
    return this.codingAttemptsService.submitAttempt(
      attemptId,
      req.user.userId,
    );
  }


  @UseGuards(AuthGuard('jwt'))
@Get(':id')
findOne(
  @Param('id') id: string,
  @Request() req,
) {
  return this.codingAttemptsService.findOne(
    id,
    req.user.userId,
  );
}


 @UseGuards(AuthGuard('jwt'))
@Post(':attemptId/basic/final-submit')
finalSubmit(
  @Param('attemptId') attemptId: string,
  @Request() req,
) {
  return this.codingAttemptsService.finalSubmit(
    attemptId,
    req.user.userId,
  );
}


@UseGuards(AuthGuard('jwt'))
@Post(':attemptId/security-event')
logSecurityEvent(
  @Param('attemptId')
  attemptId: string,

  @Body()
  dto: CreateSecurityEventDto,

  @Request()
  req,
) {
  return this.codingAttemptsService.logSecurityEvent(
    attemptId,
    req.user.userId,
    dto.eventType,
    dto.details,
  );
}
}