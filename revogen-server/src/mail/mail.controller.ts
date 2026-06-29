import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('test')
  async sendTest(@Body() body: { email: string }) {
    await this.mailService.sendTestEmail(body.email);

    return {
      success: true,
      message: 'Email sent successfully.',
    };
  }
}