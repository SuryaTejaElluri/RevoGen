import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { strictBody } from '../common/roles';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Get, Query } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body(strictBody()) dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body(strictBody()) dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Get('validate-reset-token')
  async validateResetToken(@Query('token') token: string) {
    return this.authService.validateResetToken(token);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}