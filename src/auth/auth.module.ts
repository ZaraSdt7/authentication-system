import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './service/auth.service';

import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh.strategy';

import { RefreshTokenEntity } from './entity/refresh-token.entity';
import { DatabaseConfig } from '../database/database.config.service';
import { UserEntity } from '../users/entity/user.entity';
import { AuthController } from './controller/auth.controller';
import { OtpModule } from '../otp/otp.module';
import { SessionsModule } from '../sessions/session.module';
import { UsersModule } from '../users/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
    JwtModule.register({}),
    OtpModule,
    SessionsModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy, DatabaseConfig],
  exports: [AuthService],
})
export class AuthModule {}
