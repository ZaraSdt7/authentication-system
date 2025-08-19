import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor
{
  
    private readonly logger = new Logger('HTTP')

   intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>>
    {
        const req = context.switchToHttp().getRequest();
        const {method , url , ip } = req;
        const start = Date.now();
        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - start;
                this.logger.log(`${method} ${url} ${ip} - ${duration}ms`);
            })
        );
    }
}