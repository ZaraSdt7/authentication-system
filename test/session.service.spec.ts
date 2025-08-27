import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SessionsService } from '../src/sessions/service/session.service';
import { SessionEntity } from '../src/sessions/entitiy/session.entity';

describe('SessionsService', () => {
  let service: SessionsService;
  let repo: Repository<SessionEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    repo = module.get<Repository<SessionEntity>>(getRepositoryToken(SessionEntity));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create a session successfully', async () => {
    const userId = 'u1';
    const token = 'refresh-token';
    const fakeSession = { id: 's1' } as any;

    jest.spyOn(repo, 'create').mockReturnValue(fakeSession);
    jest.spyOn(service as any, 'enforceMaxSessions').mockResolvedValue(undefined);
    jest.spyOn(repo, 'save').mockResolvedValue(fakeSession);

    const result = await service.createSession(userId, token, '127.0.0.1', 'UA', 5000);

    expect(result).toBe(fakeSession);
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledWith(fakeSession);
  });

  it('should validate refresh token successfully', async () => {
    const token = 'refresh-token';
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(token + salt).digest('hex');
    const session: any = { refreshTokenHash: `${salt}:${hash}`, isValid: true, revoked: false, expiresAt: new Date(Date.now() + 5000) };

    jest.spyOn(repo, 'find').mockResolvedValue([session]);

    const result = await service.validateRefreshToken('u1', token);
    expect(result).toEqual(session);
  });

  it('should rotate token and update session', async () => {
    const oldToken = 'old-token';
    const newToken = 'new-token';

    const oldSalt = crypto.randomBytes(16).toString('hex');
    const oldHash = crypto.createHash('sha256').update(oldToken + oldSalt).digest('hex');
    const session: any = { 
      id: 's1', 
      refreshTokenHash: `${oldSalt}:${oldHash}`, 
      isValid: true, 
      revoked: false,
      ip: '',
      userAgent: '',
      save: jest.fn().mockImplementation(async (s) => s)
    };

    jest.spyOn(service, 'validateRefreshToken').mockResolvedValue({ ...session });
    jest.spyOn(repo, 'save').mockImplementation(async (s: any, options?: any) => s as any);

    const result = await service.rotateSession('u1', oldToken, newToken, 5000, '127.0.0.1', 'UA');

    expect(result.refreshTokenHash).not.toEqual(session.refreshTokenHash);
    expect(result.ip).toEqual('127.0.0.1');
    expect(result.userAgent).toEqual('UA');
  });

  it('should revoke a session successfully', async () => {
    const s: any = { id: 's1', isValid: true, revoked: false };
    jest.spyOn(repo, 'findOne').mockResolvedValue(s);
    jest.spyOn(repo, 'save').mockResolvedValue({ ...s, isValid: false, revoked: true });

    await service.revokeSession('s1');

    expect(repo.save).toHaveBeenCalledWith({ ...s, isValid: false, revoked: true });
  });

  it('should throw NotFoundException when revoking non-existing session', async () => {
    jest.spyOn(repo, 'findOne').mockResolvedValue(null);
    await expect(service.revokeSession('s1')).rejects.toThrow(NotFoundException);
  });

  it('should revoke all user sessions', async () => {
    jest.spyOn(repo, 'update').mockResolvedValue({} as any);
    await service.revokeAllUserSessions('u1');
    expect(repo.update).toHaveBeenCalledWith(
      { userId: 'u1', revoked: false, isValid: true },
      { revoked: true, isValid: false },
    );
  });

  it('should list user sessions', async () => {
    const sessions = [{ id: 's1', userId: 'u1' }];
    jest.spyOn(repo, 'find').mockResolvedValue(sessions as any);
    const result = await service.listUserSessions('u1');
    expect(result).toEqual(sessions);
  });
});
