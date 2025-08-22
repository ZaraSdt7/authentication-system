import {
  Controller, Post, Body, Req, UseGuards, ForbiddenException
} from '@nestjs/common';
import { Request } from 'express';
import { RequestOtpDto } from '../dto/request-otp.dto';
import { AuthService } from '../service/auth.service';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../roles/roleguard/role.guard';


function extractClient(req: Request) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '';
  const ua = (req.headers['user-agent'] as string) || '';
  return { ip, ua };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) { }

  @Post('request-otp')
  @UseGuards(RateLimitGuard)
  async requestOtp(@Body() dto: RequestOtpDto, @Req() req: Request) {
    const { ip } = extractClient(req);
    return this.auth.requestOtp(dto, ip);
  }


  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    const { ip } = extractClient(req);
    return this.auth.validateOtp(dto, ip);
  }


  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const { ip, ua } = extractClient(req);
    return this.auth.refreshTokens(dto, ip, ua);
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER', 'ADMIN') // Both USER and ADMIN can logout
  @Post('logout')
  async logout(@Req() req: any) {
    if (!req.user?.userId) {
      throw new ForbiddenException('Invalid session');
    }
    return this.auth.logout(req.user.userId);
  }
}
