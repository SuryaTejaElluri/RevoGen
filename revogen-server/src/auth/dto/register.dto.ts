import { IsEmail, IsString, IsOptional, IsIn, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsIn(['USER', 'ADMIN'])
  @IsOptional()
  role?: string;
}