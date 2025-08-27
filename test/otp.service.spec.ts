import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from '../src/otp/service/otp.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OtpEntity } from '../src/otp/entity/otp.entity';
import { Repository } from 'typeorm';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('OtpService', () => {
  let service: OtpService;
  let mockRepo: jest.Mocked<Repository<OtpEntity>>;
  let otpArray: OtpEntity[] = [];

  beforeEach(async () => {
    otpArray = [];

    mockRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: getRepositoryToken(OtpEntity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);


    mockRepo.count.mockResolvedValue(0);
    mockRepo.findOne.mockResolvedValue(null);
  });

  describe('generateOtp', () => {
    it('✅ should generate OTP successfully', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.count.mockResolvedValue(0);

      mockRepo.create.mockImplementation((otp) => otp as any);
      mockRepo.save.mockImplementation(async (otp) => {
        otpArray.push(otp as any);
        return otp as any;
      });

      const code = await service.generateOtp('09121234567', '127.0.0.1');

      expect(code).toHaveLength(6);
      expect(mockRepo.save).toHaveBeenCalled();
      expect(otpArray[0].phoneNumber).toBe('09121234567');
    });

    it('❌ should block resend within cooldown', async () => {
      const recentOtp = { phoneNumber: '09121234567', createdAt: new Date() } as any;
      mockRepo.findOne.mockResolvedValue(recentOtp);

      await expect(service.generateOtp('09121234567', '127.0.0.1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('❌ should block if too many requests', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.count.mockResolvedValue(5);

      await expect(service.generateOtp('09121234567', '127.0.0.1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('verifyOtp', () => {
    it('❌ should throw if OTP not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.verifyOtp('09121234567', '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ should throw if OTP expired', async () => {
      const otp = { expiresAt: new Date(Date.now() - 1000), used: false } as any;
      mockRepo.findOne.mockResolvedValue(otp);

      await expect(service.verifyOtp('09121234567', '123456')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('❌ should throw if OTP invalid', async () => {

      mockRepo.count.mockResolvedValue(0);
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockImplementation((otp) => otp as any);
      mockRepo.save.mockImplementation(async (otp) => otp as any);

      const code = await service.generateOtp('09121234567', '127.0.0.1');

      const storedOtp = {
        code: otpArray[0]?.code || 'salt:fakehash',
        used: false,
        expiresAt: new Date(Date.now() + 1000),
      } as any;
      mockRepo.findOne.mockResolvedValue(storedOtp);

      await expect(service.verifyOtp('09121234567', '999999')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('✅ should verify OTP successfully', async () => {
      mockRepo.count.mockResolvedValue(0);
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockImplementation((otp) => otp as any);
      mockRepo.save.mockImplementation(async (otp) => {
        otpArray.push(otp as any);
        return otp as any;
      });

      const code = await service.generateOtp('09121234567', '127.0.0.1');

      const otpEntity = {
        ...otpArray[0],
        used: false,
        expiresAt: new Date(Date.now() + 1000),
      };

      mockRepo.findOne.mockResolvedValue(otpEntity);
      mockRepo.save.mockResolvedValue({ ...otpEntity, used: true });

      const result = await service.verifyOtp('09121234567', code);

      expect(result).toBe(true);
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ used: true }),
      );
    });
  });
});
