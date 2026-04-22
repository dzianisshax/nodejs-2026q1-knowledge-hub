import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { ForbiddenError } from '../../common/errors/app-errors';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user, method } = context.switchToHttp().getRequest();
    const role: UserRole = user?.role;

    // Admin has full access
    if (role === UserRole.ADMIN) return true;

    // Viewer — GET only
    if (role === UserRole.VIEWER) {
      if (method === 'GET') return true;
      throw new ForbiddenError('Viewers have read-only access');
    }

    // Editor — GET + POST/PUT on own content
    if (role === UserRole.EDITOR) {
      if (method === 'GET') return true;
      if (method === 'POST' || method === 'PUT') return true;
      throw new ForbiddenError(
        'Editors cannot delete resources or manage categories',
      );
    }

    throw new ForbiddenError('Insufficient permissions');
  }
}
