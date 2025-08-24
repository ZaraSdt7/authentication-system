export class SessionResponseDto {
  id: string;
  userId: string;
  ip?: string;
  userAgent?: string;
  isValid: boolean;
  revoked: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}