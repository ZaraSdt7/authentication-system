import { IsPhoneNumber, IsString } from 'class-validator';

export class RequestOtpDto {
  @IsPhoneNumber('IR') 
  phoneNumber: string;

  @IsString()
  captchaToken: string;
}
