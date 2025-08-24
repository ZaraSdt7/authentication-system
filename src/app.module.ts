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
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/user.module';
import { RolesModule } from './roles/role.module';
import { OtpModule } from './otp/otp.module';
import { SessionsModule } from './sessions/session.module';



@Module({
  imports: [
    DatabaseConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [DatabaseConfigModule],
      inject: [DatabaseConfig],
      useFactory: (config: DatabaseConfig) =>
        config.getDatabaseConfig() as TypeOrmModuleOptions,
    }),
    AuthModule,
    UsersModule,
    OtpModule,
    RolesModule,
    SessionsModule
  ],
  providers: [
    // Global Exception Handler
    { provide: APP_FILTER, useClass: HttpExceptionFilter },

    //Logging & Transforming Responses
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },

    //Validation (Global Pipes)
    { provide: APP_PIPE, useClass: ValidationPipe },

    //Rate Limit (Global Guard)
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
})
export class AppModule { }
