import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
// Using crypto module instead of bcryptjs
import * as crypto from 'crypto';
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
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString('hex');
    // Hash the code with the salt using SHA-256
    const hash = crypto.createHash('sha256').update(code + salt).digest('hex');
    const hashedCode = `${salt}:${hash}`;

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

    // Split the stored hash into salt and hash components
    const [salt, storedHash] = otp.code.split(':');
    // Hash the provided code with the same salt
    const hash = crypto.createHash('sha256').update(code + salt).digest('hex');
    // Compare the hashes
    const isValid = storedHash === hash;
    if (!isValid) throw new ForbiddenException('Invalid OTP');

    otp.used = true;
    await this.otpRepo.save(otp);

    return true;
  }
}
