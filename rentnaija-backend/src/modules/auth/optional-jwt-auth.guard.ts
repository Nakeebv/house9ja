import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Always allow the request — authentication is best-effort
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // Missing or invalid token — continue with req.user = undefined
    }
    return true;
  }

  handleRequest<TUser = any>(_err: any, user: TUser): TUser {
    // Never throw — return user (may be undefined/false for unauthenticated requests)
    return user || (undefined as any);
  }
}
