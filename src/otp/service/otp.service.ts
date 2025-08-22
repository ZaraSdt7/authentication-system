import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { OtpEntity } from '../entity/otp.entity';

@Injectable()
export class OtpService {
  private readonly OTP_EXPIRATION_MS = 2 * 60 * 1000; 
  private readonly RESEND_COOLDOWN_MS = 60 * 1000; 

  constructor(
    @InjectRepository(OtpEntity)
    private readonly otpRepo: Repository<OtpEntity>,
  ) {}

  async generateOtp(phoneNumber: string, clientIp: string): Promise<string> {
    const now = new Date();


    const lastOtp = await this.otpRepo.findOne({
      where: { phoneNumber },
      order: { createdAt: 'DESC' },
    });

    if (lastOtp && now.getTime() - lastOtp.createdAt.getTime() < this.RESEND_COOLDOWN_MS) {
      throw new ForbiddenException('OTP already sent, please wait before requesting again.');
    }


    const recentOtps = await this.otpRepo.count({
      where: {
        phoneNumber,
        createdAt: MoreThan(new Date(now.getTime() - 10 * 60 * 1000)), 
      },
    });
    if (recentOtps >= 5) {
      throw new ForbiddenException('Too many OTP requests, please try later.');
    }

  
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const hashedCode = await bcrypt.hash(code, 10);

    const expiresAt = new Date(now.getTime() + this.OTP_EXPIRATION_MS);

    const otp = this.otpRepo.create({
      phoneNumber,
      code: hashedCode,
      expiresAt,
      ip: clientIp,
    });

    await this.otpRepo.save(otp);

    return code; 
  }

 
  async verifyOtp(phoneNumber: string, code: string): Promise<boolean> {
    const otp = await this.otpRepo.findOne({
      where: { phoneNumber, used: false },
      order: { createdAt: 'DESC' },
    });

    if (!otp) throw new BadRequestException('OTP not found');
    if (otp.expiresAt < new Date()) throw new ForbiddenException('OTP expired');

    const isValid = await bcrypt.compare(code, otp.code);
    if (!isValid) throw new ForbiddenException('Invalid OTP');

    otp.used = true;
    await this.otpRepo.save(otp);

    return true;
  }
}
