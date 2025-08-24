import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { RequestOtpDto } from '../dto/request-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { DatabaseConfig } from '../../database/database.config.service';
import { OtpService } from '../../otp/service/otp.service';
import { UsersService } from '../../users/service/user.service';
import { JwtPayload } from '../strategies/jwt-payload.interface';
import { UserEntity } from '../../users/entity/user.entity';
import { SessionsService } from '../../sessions/service/session.service';



@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private readonly usersRepo: Repository<UserEntity>,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
    private readonly config: DatabaseConfig,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) {}

  
  async requestOtp(dto: RequestOtpDto, ip?: string) {
    try {
      await this.otpService.generateOtp(dto.phoneNumber, ip ?? '');

      return { message: 'If eligible, OTP will be sent' };
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to request OTP');
    }
  }


  async validateOtp(dto: VerifyOtpDto, ip?: string, userAgent?: string) {
    try {
      const isValid = await this.otpService.verifyOtp(dto.phoneNumber, dto.code);
      if (!isValid) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }


      let user = await this.usersService
        .getUserByPhone(dto.phoneNumber)
        .catch(() => null);

      if (!user) {
        user = await this.usersService.createUser({ phoneNumber: dto.phoneNumber });
      }

      return await this.issueTokens(user, ip, userAgent);
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to validate OTP');
    }
  }


  async verifyOtp(dto: VerifyOtpDto, ip?: string, userAgent?: string) {
    return this.validateOtp(dto, ip, userAgent);
  }


  async refreshTokens(dto: RefreshTokenDto, ip?: string, userAgent?: string) {
    try {
   
      const payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const userId = payload.sub;
      await this.sessionsService.validateRefreshToken(userId, dto.refreshToken);

      const newPayload: JwtPayload = {
        sub: userId,
        phoneNumber: payload.phoneNumber,
      };

      const accessToken = await this.jwtService.signAsync(newPayload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
      });

      const newRefreshToken = await this.jwtService.signAsync(newPayload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      });

      const refreshTtlMs = this.parseTtl(this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d');

      await this.sessionsService.rotateSession(
        userId,
        dto.refreshToken,
        newRefreshToken,
        refreshTtlMs,
        ip,
        userAgent,
      );

      return {
        tokenType: 'Bearer',
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.sessionsService.revokeAllUserSessions(userId);
    return { message: 'Logged out' };
  }

  private async issueTokens(user: UserEntity, ip?: string, userAgent?: string) {
    const payload: JwtPayload = {
      sub: user.id,
      phoneNumber: user.phoneNumber,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    const refreshTtlMs = this.parseTtl(this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d');
    await this.sessionsService.createSession(
      user.id,
      refreshToken,
      ip,
      userAgent,
      refreshTtlMs,
    );

    return {
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        roles: user.roles,
        isActive: user.isActive,
      },
      tokenType: 'Bearer',
      accessToken,
      refreshToken,
      expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
    };
  }

  private parseTtl(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 0;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 0;
    }
  }
}
