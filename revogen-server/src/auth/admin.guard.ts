import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ROLES } from '../common/roles';

/** Recruiters and super admins. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const role = context.switchToHttp().getRequest().user?.role;
    if (role !== ROLES.RECRUITER && role !== ROLES.SUPER_ADMIN) {
      throw new ForbiddenException('Admins only');
    }
    return true;
  }
}
