import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';

import { RequestOtpDto } from '../dto/request-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { DatabaseConfig } from '../../database/database.config.service';
import { RefreshTokenEntity } from '../entity/refresh-token.entity';
import { OtpService } from '../../otp/service/otp.service';
import { UsersService } from '../../users/service/user.service';
import { JwtPayload } from '../strategies/jwt-payload.interface';
import { UserEntity } from '../../users/entity/user.entity';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity) private readonly refreshRepo: Repository<RefreshTokenEntity>,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
    private readonly config: DatabaseConfig,
    private readonly usersService: UsersService,
  ) { }

  async validateOtp(dto: VerifyOtpDto, ip: string) {
    try {
      const isValid = await this.otpService.verifyOtp(dto.phoneNumber, dto.code);
      if (!isValid) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }

      // Check for user existence
      let user = await this.usersService.getUserByPhone(dto.phoneNumber).catch(() => null);

      if (!user) {
        user = await this.usersService.createUser({ phoneNumber: dto.phoneNumber });
      }

      const payload: JwtPayload = { sub: user.id, phoneNumber: user.phoneNumber };
      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      return {
        user,
        accessToken,
        refreshToken,
      };
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

  async requestOtp(dto: RequestOtpDto, ip?: string) {
    try {
      await this.otpService.generateOtp(dto.phoneNumber, ip ?? '');
      return { message: 'If eligible, OTP will be sent' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to request OTP');
    }
  }

  async verifyOtp(dto: VerifyOtpDto, ip?: string, result?: string) {
    try {
      const valid = await this.otpService.verifyOtp(dto.phoneNumber, dto.code);
      if (!valid) throw new UnauthorizedException('Invalid or expired OTP');

      let user = await this.users.findOne({ where: { phoneNumber: dto.phoneNumber } });
      if (!user) {
        user = this.users.create({ phoneNumber: dto.phoneNumber });
        user = await this.users.save(user);
      }

      return await this.issueTokens(user, ip, result);
    } catch (error) {
      throw new InternalServerErrorException('Failed to verify OTP');
    }
  }

  private async issueTokens(user: UserEntity, ip?: string, result?: string) {
    const jti = randomBytes(16).toString('hex');
    const payload = { sub: user.id, phone: user.phoneNumber, jti };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    const hashed = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const entity = this.refreshRepo.create({ user, hashedToken: hashed, expiresAt, ip, userAgent: result });
    await this.refreshRepo.save(entity);

    return {
      tokenType: 'Bearer',
      accessToken,
      refreshToken,
      expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
    };
  }

  async refreshTokens(dto: RefreshTokenDto, ip?: string, result?: string) {
    try {
      const payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      const hashed = createHash('sha256').update(dto.refreshToken).digest('hex');
      const stored = await this.refreshRepo.findOne({
        where: { hashedToken: hashed },
        relations: ['user'],
      });

      if (!stored || stored.expiresAt < new Date()) {
        throw new ForbiddenException('Refresh token expired or invalid');
      }

      await this.refreshRepo.delete(stored.id);

      return await this.issueTokens(stored.user, ip, result);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: number) {
    await this.refreshRepo.delete({ user: { id: userId } });
    return { message: 'Logged out' };
  }
}
