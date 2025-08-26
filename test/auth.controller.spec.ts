import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ForbiddenException } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from '../src/auth/controller/auth.controller';
import { AuthService } from '../src/auth/service/auth.service';
import { RateLimitGuard } from '../src/common/guards/rate-limit.guard';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/roles/roleguard/role.guard';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: any;

  beforeEach(async () => {
    authService = {
      requestOtp: jest.fn().mockResolvedValue({ message: 'OTP sent' }),
      validateOtp: jest.fn().mockResolvedValue({ accessToken: 'test', refreshToken: 'refresh' }),
      refreshTokens: jest.fn().mockResolvedValue({ accessToken: 'new', refreshToken: 'new-refresh' }),
      logout: jest.fn().mockResolvedValue({ message: 'Logged out' }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(RateLimitGuard).useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard).useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
    
          req.user = { sub: 'user-123', role: 'USER' };
          return true;
        },
      })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/request-otp (POST)', () => {
    it(' should request OTP', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/request-otp')
        .send({ phoneNumber: '+989123456789', captchaToken: 'captcha' })
        .expect(201);

      expect(res.body).toEqual({ message: 'OTP sent' });
      expect(authService.requestOtp).toHaveBeenCalled();
    });
  });

  describe('/auth/verify-otp (POST)', () => {
    it(' should verify OTP and return tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ phoneNumber: '+989123456789', code: '123456' })
        .expect(201);

      expect(res.body).toEqual({ accessToken: 'test', refreshToken: 'refresh' });
      expect(authService.validateOtp).toHaveBeenCalled();
    });
  });

  describe('/auth/refresh (POST)', () => {
    it(' should refresh tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'refresh' })
        .expect(201);

      expect(res.body).toEqual({ accessToken: 'new', refreshToken: 'new-refresh' });
      expect(authService.refreshTokens).toHaveBeenCalled();
    });
  });

  describe('/auth/logout (POST)', () => {
    it(' should logout successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer fake-jwt')
        .send({})
        .expect(201);

      expect(res.body).toEqual({ message: 'Logged out' });
      expect(authService.logout).toHaveBeenCalledWith('user-123');
    });

    it(' should throw Forbidden if no userId', async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [{ provide: AuthService, useValue: authService }],
      })
        .overrideGuard(JwtAuthGuard).useValue({
          canActivate: (context) => {
            const req = context.switchToHttp().getRequest();
            req.user = null; 
            return true;
          },
        })
        .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
        .compile();

      const localApp = moduleFixture.createNestApplication();
      await localApp.init();

      await request(localApp.getHttpServer())
        .post('/auth/logout')
        .send({})
        .expect(403);

      await localApp.close();
    });
  });
});
