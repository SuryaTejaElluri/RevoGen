import { IsEmail, IsString, IsOptional, IsIn, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { SELF_SIGNUP_ROLES } from '../../common/roles';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Please enter your name.' })
  @MaxLength(80)
  name: string;

  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  @MaxLength(128)
  password: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsIn(SELF_SIGNUP_ROLES, { message: 'Choose a candidate or recruiter account.' })
  @IsOptional()
  role?: string;
}
