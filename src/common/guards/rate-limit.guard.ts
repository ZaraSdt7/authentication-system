import { BadGatewayException, CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

const requestsMap = new Map<string, { count: number, last: number }>();

@Injectable()
export class RateLimitGuard implements CanActivate {
    private readonly limit = 5; // Maximum requests allowed
    private readonly windowMs = 60 * 1000; // Time window in milliseconds (1 minute)

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const ip = request.ip;

        const now = Date.now();
        const record = requestsMap.get(ip) || { count: 0, last: now };

        // Reset count if the time window has passed
        if (record && now - record.last < this.windowMs) {
            if (record.count >= this.limit) {
                throw new BadGatewayException('Too many requests, slow down.');
            }
            record.count++;

        } else {
            requestsMap.set(ip, { count: 1, last: now })
        }
        return true
    }
}