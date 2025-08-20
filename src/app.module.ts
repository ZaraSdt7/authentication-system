import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { ValidationPipe } from './common/pips/validation.pipe';
import { DatabaseConfig } from './database/database.config.service';
import { DatabaseConfigModule } from './database/database.config.module';

@Module({
  imports: [
   DatabaseConfig,
   TypeOrmModule.forRootAsync({
    imports: [DatabaseConfigModule],
    inject: [DatabaseConfig],
    useFactory: (config: DatabaseConfig) => config.getDatabaseConfig() as TypeOrmModuleOptions,
   }),
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_PIPE, useClass: ValidationPipe },
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
})
export class AppModule {}
