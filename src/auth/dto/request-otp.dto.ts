import { IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';
import { Phone } from '../../common/validator/phone';

export class RequestOtpDto {
   @Phone({ message: 'Phone number must start with 09 and be 11 digits long' })
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @Length(20, 200, { message: 'Captcha token length must be between 20 and 200 characters' })
  captchaToken: string;
}
