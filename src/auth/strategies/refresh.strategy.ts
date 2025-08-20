import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { DatabaseConfig } from '../../database/database.config.service';


@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: DatabaseConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'), 
      secretOrKey: config.get('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) throw new UnauthorizedException('Refresh token missing');
    return { ...payload, refreshToken };
  }
}
