import { IsNotEmpty, IsPhoneNumber, IsOptional, IsEmail, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsPhoneNumber('IR') 
  phoneNumber: string;

  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
