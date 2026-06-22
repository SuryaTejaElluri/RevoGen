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
@Post(':attemptId/pro/final-submit')
proFinalSubmit(
  @Param('attemptId') attemptId: string,
  @Body() body: { proctoringData?: any },
  @Request() req,
) {
  return this.codingAttemptsService.proFinalSubmit(
    attemptId,
    req.user.userId,
    body.proctoringData,
  );
}

@UseGuards(AuthGuard('jwt'))
@Get(':attemptId/pro/report')
getProAttemptReport(
  @Param('attemptId') attemptId: string,
  @Request() req,
) {
  return this.codingAttemptsService.getProAttemptReport(
    attemptId,
    req.user.userId,
  );
}


@UseGuards(AuthGuard('jwt'))
@Post(':attemptId/security-screenshot')
uploadSecurityScreenshot(
  @Param('attemptId') attemptId: string,
  @Body() body: { eventType: string; imageDataUrl: string; details?: any },
  @Request() req,
) {
  return this.codingAttemptsService.uploadSecurityScreenshot(
    attemptId,
    req.user.userId,
    body.eventType,
    body.imageDataUrl,
    body.details,
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

@UseGuards(AuthGuard('jwt'))
@Get(':attemptId/report')
getAttemptReport(
  @Param('attemptId') attemptId: string,
  @Request() req,
) {
  return this.codingAttemptsService.getAttemptReport(
    attemptId,
    req.user.userId,
  );
}
}