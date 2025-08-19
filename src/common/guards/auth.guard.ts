import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthGuard  implements CanActivate
{
    constructor(private jwtService: JwtService) {}

    canActivate(context:ExecutionContext): boolean
    {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        if(!authHeader) throw new UnauthorizedException('No token provided');

        const token = authHeader.split(' ')[1];
        try {
            const decode = this.jwtService.verify(token)
            request.user = decode;
            return true
        } catch (error) {
            throw new UnauthorizedException('Invalid token or expired token');
        }
    }
}