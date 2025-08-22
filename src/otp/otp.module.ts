import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpEntity } from './entity/otp.entity';
import { DatabaseConfigModule } from '../database/database.config.module';
import { OtpService } from './service/otp.service';

@Module({
  imports: [DatabaseConfigModule, TypeOrmModule.forFeature([OtpEntity])],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
