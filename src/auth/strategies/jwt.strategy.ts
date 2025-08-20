import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DatabaseConfig } from '../../database/database.config.service';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: DatabaseConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return { userId: payload.sub, phone: payload.phone };
  }
}
