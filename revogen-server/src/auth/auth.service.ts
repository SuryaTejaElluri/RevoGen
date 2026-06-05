import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

import { UnauthorizedException } from '@nestjs/common';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    
  ) {}

  

  async register(dto: RegisterDto) {
    const existingUser =
      await this.usersService.findByEmail(
        dto.email,
      );

    if (existingUser) {
      throw new BadRequestException(
        'Email already exists',
      );
    }

    const hashedPassword =
      await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });

    const { password, ...safeUser } = user;

return {
  message: 'User registered successfully',
  user: safeUser,
};
  }

  async login(dto: LoginDto) {
  const user = await this.usersService.findByEmail(
    dto.email,
  );

  if (!user) {
    throw new UnauthorizedException(
      'Invalid credentials',
    );
  }

  const isPasswordValid =
    await bcrypt.compare(
      dto.password,
      user.password!,
    );

  if (!isPasswordValid) {
    throw new UnauthorizedException(
      'Invalid credentials',
    );
  }

  const payload = {
  sub: user.id,
  email: user.email,
  role: user.role,
};

  return {
    access_token:
      await this.jwtService.signAsync(payload),
      role: user.role,
  };
}
}

