import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES } from '../../common/roles';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * The token proves who the user is; their role comes from the database on every
   * request, so a role change, suspension or deletion takes effect immediately
   * instead of when the 7-day token expires.
   */
  async validate(payload: { sub?: string }) {
    if (!payload?.sub) throw new UnauthorizedException();
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });
    if (!user) throw new UnauthorizedException('This account no longer exists.');
    if (user.role === ROLES.SUSPENDED) {
      throw new UnauthorizedException('This account has been suspended. Contact support.');
    }
    return { userId: user.id, email: user.email, role: user.role };
  }
}
