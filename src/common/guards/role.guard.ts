import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RoleGuard implements CanActivate 
{
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean
    {
        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!roles) {
            return true; // If no roles are defined, allow access
        }
        const {user} =  context.switchToHttp().getRequest();
       if(!user || !roles.includes(user.role)) {
        throw new ForbiddenException('Access denied: insufficient permissions');
       }
        return true; // User has the required role, allow access
}
}