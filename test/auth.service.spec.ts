import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from '../src/auth/service/auth.service';
import { OtpService } from '../src/otp/service/otp.service';
import { UsersService } from '../src/users/service/user.service';
import { SessionsService } from '../src/sessions/service/session.service';
import { UserEntity } from '../src/users/entity/user.entity';
import { DatabaseConfig } from '../src/database/database.config.service';
import { SessionEntity } from '../src/sessions/entitiy/session.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let otpService: jest.Mocked<OtpService>;
  let usersService: jest.Mocked<UsersService>;
  let sessionsService: jest.Mocked<SessionsService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useClass: Repository,
        },
        {
          provide: OtpService,
          useValue: {
            generateOtp: jest.fn(),
            verifyOtp: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUserByPhone: jest.fn(),
            createUser: jest.fn(),
          },
        },
        {
          provide: SessionsService,
          useValue: {
            createSession: jest.fn(),
            validateRefreshToken: jest.fn(),
            rotateSession: jest.fn(),
            revokeAllUserSessions: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: DatabaseConfig,
          useValue: {
            get: jest.fn((key: string) => {
              const values = {
                JWT_SECRET: 'jwt-secret',
                JWT_EXPIRES_IN: '15m',
                JWT_REFRESH_SECRET: 'refresh-secret',
                JWT_REFRESH_EXPIRES_IN: '7d',
              };
              return values[key];
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    otpService = module.get(OtpService);
    usersService = module.get(UsersService);
    sessionsService = module.get(SessionsService);
    jwtService = module.get(JwtService);
  });

  describe('requestOtp', () => {
    it(' should generate OTP successfully', async () => {
      otpService.generateOtp.mockResolvedValue('123456');
      const result = await authService.requestOtp({ phoneNumber: '09123456789', captchaToken: 'validCaptchaToken' });
      expect(result).toEqual({ message: 'If eligible, OTP will be sent' });
      expect(otpService.generateOtp).toHaveBeenCalledWith('09123456789', '');
    });

    it(' should throw ForbiddenException if too many requests', async () => {
      otpService.generateOtp.mockRejectedValue(new ForbiddenException());
      await expect(
        authService.requestOtp({ phoneNumber: '09123456789', captchaToken: 'validCaptchaToken' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('verifyOtp', () => {
    it(' should validate OTP and create new user if not exists', async () => {
      otpService.verifyOtp.mockResolvedValue(true);
      usersService.getUserByPhone.mockRejectedValue(new Error('User not found'));
      usersService.createUser.mockResolvedValue({ id: '1', phoneNumber: '09123456789', roles: [], isActive: true } as any);
      jwtService.signAsync.mockResolvedValueOnce('accessToken').mockResolvedValueOnce('refreshToken');

      const result = await authService.verifyOtp({ phoneNumber: '09123456789', code: '123456' });

      expect(result.accessToken).toBe('accessToken');
      expect(result.refreshToken).toBe('refreshToken');
      expect(sessionsService.createSession).toHaveBeenCalled();
    });

    it(' should throw UnauthorizedException if OTP invalid', async () => {
      otpService.verifyOtp.mockResolvedValue(false);
      await expect(authService.verifyOtp({ phoneNumber: '09123456789', code: '111111' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it(' should refresh tokens successfully', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: '1', phoneNumber: '09123456789' });
      sessionsService.validateRefreshToken.mockResolvedValue({ id: 'session-1', userId: '1', refreshTokenHash: 'valid.token' } as SessionEntity);
      jwtService.signAsync.mockResolvedValueOnce('newAccessToken').mockResolvedValueOnce('newRefreshToken');

      const result = await authService.refreshTokens({ refreshToken: 'valid.token' });

      expect(result.accessToken).toBe('newAccessToken');
      expect(result.refreshToken).toBe('newRefreshToken');
      expect(sessionsService.rotateSession).toHaveBeenCalled();
    });

    it(' should throw UnauthorizedException if refresh token invalid', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));
      await expect(authService.refreshTokens({ refreshToken: 'invalid.token' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it(' should revoke all sessions', async () => {
      await authService.logout('1');
      expect(sessionsService.revokeAllUserSessions).toHaveBeenCalledWith('1');
    });
  });
});