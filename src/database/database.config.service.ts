import { Injectable } from "@nestjs/common";
import { ConfigService as NestConfigService } from '@nestjs/config';
@Injectable()
export class DatabaseConfig
{
      constructor(private configService: NestConfigService) {}

      get<T = string>(key: string): T | undefined
      {
        return this.configService.get<T>(key);
      }

      getDatabaseConfig() {
        return {
            type:'mysql',
            host:this.get('DB_HOST'),
            port:Number(this.get('DB_PORT')),
            username:this.get('DB_USER'),
            password:this.get('DB_PASS'),
            autoLoadEntities: true,
            synchronize: true,
        }
      }
      getJwtConfig() {
    return {
      secret: this.get('JWT_SECRET'),
      signOptions: { expiresIn: this.get('JWT_EXPIRES_IN') },
    };
  }

  getJwtRefreshConfig() {
    return {
      secret: this.get('JWT_REFRESH_SECRET'),
      signOptions: { expiresIn: this.get('JWT_REFRESH_EXPIRES_IN') },
    };
  }

  getOtpConfig() {
    return {
      length: Number(this.get('OTP_LENGTH') || 6),
      expiry: Number(this.get('OTP_EXPIRY') || 120),
    };
  }

  getRateLimitConfig() {
    return {
      limit: Number(this.get('RATE_LIMIT_MAX') || 5),
      window: Number(this.get('RATE_LIMIT_WINDOW') || 60000),
    };
  }
}