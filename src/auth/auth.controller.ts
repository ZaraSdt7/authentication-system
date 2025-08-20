import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('request-otp')
  async requestOtp(@Body() dto: RequestOtpDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '';
    return this.auth.requestOtp(dto, ip);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '';
    const ua = (req.headers['user-agent'] as string) || '';
    return this.auth.verifyOtp(dto, ip, ua);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '';
    const ua = (req.headers['user-agent'] as string) || '';
    return this.auth.refreshTokens(dto, ip, ua);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    return this.auth.logout(req.user.userId);
  }
}
