import { IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class RevokeSessionDto {
  @IsUUID()
  sessionId: string;

  @IsOptional()
  @IsBoolean()
  revokeFamily?: boolean; // If true, the entire family is revoked
}
