import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ROLES } from '../common/roles';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (request.user?.role !== ROLES.SUPER_ADMIN) {
      throw new ForbiddenException('Super admins only');
    }
    return true;
  }
}
