import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserEntity } from '../users/entities/user.entity';
import { OtpModule } from '../otp/otp.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh.strategy';

import { RefreshTokenEntity } from './entity/refresh-token.entity';
import { DatabaseConfig } from '../database/database.config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
    JwtModule.register({}),
    OtpModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy, DatabaseConfig],
  exports: [AuthService],
})
export class AuthModule {}
