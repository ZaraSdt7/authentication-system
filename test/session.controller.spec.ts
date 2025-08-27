import { Test, TestingModule } from '@nestjs/testing';
import { SessionsController } from '../src/sessions/controller/session.controller';
import { SessionsService } from '../src/sessions/service/session.service';

describe('SessionsController', () => {
  let controller: SessionsController;
  let service: SessionsService;

  const mockSessionsService = {
    listUserSessions: jest.fn(),
    revokeSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        {
          provide: SessionsService,
          useValue: mockSessionsService,
        },
      ],
    })
    // override guards to bypass authentication
    .overrideGuard('JwtAuthGuard')
    .useValue({ canActivate: () => true })
    .overrideGuard('RolesGuard')
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<SessionsController>(SessionsController);
    service = module.get<SessionsService>(SessionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list current user sessions', async () => {
    const userId = 'u1';
    const req = { user: { userId } };
    const sessions = [{ id: 's1' }, { id: 's2' }];
    mockSessionsService.listUserSessions.mockResolvedValue(sessions);

    const result = await controller.mySessions(req);
    expect(result).toEqual(sessions);
    expect(mockSessionsService.listUserSessions).toHaveBeenCalledWith(userId);
  });

  it('should revoke a session successfully', async () => {
    const sessionId = 's1';
    const req = { user: { userId: 'u1' } };
    mockSessionsService.revokeSession.mockResolvedValue(undefined);

    const result = await controller.revoke(sessionId, req);
    expect(result).toEqual({ success: true });
    expect(mockSessionsService.revokeSession).toHaveBeenCalledWith(sessionId);
  });

  it('should throw if service throws on revoke', async () => {
    const sessionId = 's1';
    const req = { user: { userId: 'u1' } };
    mockSessionsService.revokeSession.mockRejectedValue(new Error('fail'));

    await expect(controller.revoke(sessionId, req)).rejects.toThrow('fail');
  });
});
