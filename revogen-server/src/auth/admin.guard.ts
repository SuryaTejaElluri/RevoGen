import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard
  implements CanActivate
{
  canActivate(
    context: ExecutionContext,
  ): boolean {
    const request =
      context
        .switchToHttp()
        .getRequest();

    if (
      request.user.role !==
      'ADMIN'
    ) {
      throw new ForbiddenException(
        'Admins only',
      );
    }
    console.log(request.user);
    return true;
  }
}