import { IsPhoneNumber, IsString, Length, IsNotEmpty, Matches } from 'class-validator';
import { Phone } from '../../common/validator/phone';

export class VerifyOtpDto {
  @Phone({ message: 'Phone number must start with 09 and be 11 digits long' })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP code must contain only digits' })
  code: string;
}