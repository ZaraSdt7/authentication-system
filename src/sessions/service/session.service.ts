import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { SessionEntity } from '../entitiy/session.entity';


@Injectable()
export class SessionsService {
  private readonly BCRYPT_ROUNDS = 12;
  private readonly DEFAULT_MAX_SESSIONS_PER_USER = 5;

  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
  ) {}

  /**
   * Create a new session for the user
   * @param userId
   * @param refreshTokenRaw The raw token (not hashed or stored)
   * @param ip
   * @param userAgent
   * @param ttlMs Time to live in milliseconds
   * @param tokenFamilyId If null, a new family is created
   */
  async createSession(
    userId: string,
    refreshTokenRaw: string,
    ip?: string,
    userAgent?: string,
    ttlMs?: number,
    tokenFamilyId?: string,
  ): Promise<SessionEntity> {
    try {
      const refreshTokenHash = await bcrypt.hash(refreshTokenRaw, this.BCRYPT_ROUNDS);

      const session = this.sessionRepo.create({
        userId,
        refreshTokenHash,
        tokenFamilyId: tokenFamilyId || uuid(),
        ip,
        userAgent,
        isValid: true,
        revoked: false,
        lastUsedAt: new Date(),
        expiresAt: ttlMs ? new Date(Date.now() + ttlMs) : undefined,
      } as unknown as SessionEntity);

      // Limit the number of active sessions per user
      await this.enforceMaxSessions(userId, this.DEFAULT_MAX_SESSIONS_PER_USER);

      return await this.sessionRepo.save(session);
    } catch (e) {
      throw new InternalServerErrorException('Failed to create session');
    }
  }

  /**
   * Validate the refresh token and return the session
   * Checks: existence, revocation, expiration, and hash match
   */
  async validateRefreshToken(
    userId: string,
    presentedRefreshToken: string,
  ): Promise<SessionEntity> {
    const sessions = await this.sessionRepo.find({
      where: { userId, isValid: true, revoked: false },
      order: { updatedAt: 'DESC' },
    });

    // Compare the presented token with each session's token
    let matched: SessionEntity | null = null;
    for (const result of sessions) {
      const ok = await bcrypt.compare(presentedRefreshToken, result.refreshTokenHash);
      if (ok) {
        matched = result;
        break;
      }
    }

    if (!matched) {
      // The presented token does not belong to any active session → potential reuse/theft
      // (You can decide to revoke all families here)
      throw new ForbiddenException('Invalid refresh token');
    }

    if (matched.expiresAt && matched.expiresAt < new Date()) {
      // The expiration date has passed → revoke the session
      await this.revokeSession(matched.id);
      throw new ForbiddenException('Refresh token expired');
    }

    if (!matched.isValid || matched.revoked) {
      throw new ForbiddenException('Refresh token revoked');
    }

    return matched;
  }

  /**
   * Secure rotation: Instead of invalidating the old token, we update the same session
   * with a new hash and change lastUsedAt.
   * If the presented token does not match the current session → abuse → revoke family
   */
  async rotateSession(
    userId: string,
    oldRefreshToken: string,
    newRefreshToken: string,
    newTtlMs?: number,
    ip?: string,
    userAgent?: string,
  ): Promise<SessionEntity> {
    // Validate the session for the presented token
    const session = await this.validateRefreshToken(userId, oldRefreshToken);

    // Generate a new hash
    const newHash = await bcrypt.hash(newRefreshToken, this.BCRYPT_ROUNDS);

    // Update the session
    session.refreshTokenHash = newHash;
    session.lastUsedAt = new Date();
    session.ip = ip || session.ip;
    session.userAgent = userAgent || session.userAgent;
    session.expiresAt = newTtlMs ? new Date(Date.now() + newTtlMs) : session.expiresAt;

    return this.sessionRepo.save(session);
  }


 
  async revokeSession(sessionId: string): Promise<void> {
    const s = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!s) throw new NotFoundException('Session not found');
    s.isValid = false;
    s.revoked = true;
    await this.sessionRepo.save(s);
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.sessionRepo.update(
      { userId, revoked: false, isValid: true },
      { revoked: true, isValid: false },
    );
  }

  /**
   * Revoke all sessions for a family (tokenFamilyId)
   */
  async revokeFamily(tokenFamilyId: string): Promise<void> {
    await this.sessionRepo.update(
      { tokenFamilyId, revoked: false, isValid: true },
      { revoked: true, isValid: false },
    );
  }

  /**
   * Cleanup expired sessions (for cron job)
   */
  async cleanupExpired(): Promise<void> {
    await this.sessionRepo.update(
      { expiresAt: LessThan(new Date()), isValid: true },
      { isValid: false, revoked: true },
    );
  }

  /**
   * Limit the number of active sessions for a user
   * If it exceeds max, revoke the oldest ones
   */
  private async enforceMaxSessions(userId: string, maxActive: number): Promise<void> {
    const active = await this.sessionRepo.find({
      where: { userId, isValid: true, revoked: false },
      order: { createdAt: 'ASC' },
    });
    if (active.length < maxActive) return;

    const needRevoke = active.length - maxActive + 1;
    const victims = active.slice(0, needRevoke);
    for (const v of victims) {
      v.isValid = false;
      v.revoked = true;
    }
    await this.sessionRepo.save(victims);
  }

  async listUserSessions(userId: string) {
    const list = await this.sessionRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      select: [
        'id',
        'userId',
        'ip',
        'userAgent',
        'isValid',
        'revoked',
        'lastUsedAt',
        'createdAt',
        'expiresAt',
        'tokenFamilyId',
      ],
    });

    return list;
  }
}
