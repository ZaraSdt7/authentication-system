import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../src/users/controller/user.controller';
import { UsersService } from '../src/users/service/user.service';
import { ForbiddenException } from '@nestjs/common';
describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    createUser: jest.fn(),
    getUserByPhone: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should call service and return result', async () => {
      const dto = { phoneNumber: '0912', name: 'Zahra' } as any;
      mockUsersService.createUser.mockResolvedValue({ id: '1', ...dto });

      const result = await controller.createUser(dto);

      expect(service.createUser).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: '1', ...dto });
    });
  });

  describe('getUser', () => {
    it('should allow ADMIN to fetch any user', async () => {
      const req = { user: { role: 'ADMIN' } };
      mockUsersService.getUserByPhone.mockResolvedValue({ id: '1', phoneNumber: '0912' });

      const result = await controller.getUser('0912', req);

      expect(service.getUserByPhone).toHaveBeenCalledWith('0912');
      expect(result).toEqual({ id: '1', phoneNumber: '0912' });
    });

    it('should allow USER to fetch own user', async () => {
      const req = { user: { role: 'USER', phoneNumber: '0912' } };
      mockUsersService.getUserByPhone.mockResolvedValue({ id: '1', phoneNumber: '0912' });

      const result = await controller.getUser('0912', req);

      expect(result.phoneNumber).toEqual('0912');
    });

    it('should forbid USER from fetching others', async () => {
      const req = { user: { role: 'USER', phoneNumber: '0999' } };

      await expect(controller.getUser('0912', req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateUser', () => {
    it('should allow ADMIN to update any user', async () => {
      const dto = { name: 'new' } as any;
      const req = { user: { role: 'ADMIN' } };

      mockUsersService.updateUser.mockResolvedValue({ id: '1', ...dto });

      const result = await controller.updateUser('1', dto, req);

      expect(service.updateUser).toHaveBeenCalledWith('1', dto);
      expect(result).toEqual({ id: '1', ...dto });
    });

    it('should allow USER to update own profile', async () => {
      const dto = { name: 'me' } as any;
      const req = { user: { role: 'USER', id: '1' } };

      mockUsersService.updateUser.mockResolvedValue({ id: '1', ...dto });

      const result = await controller.updateUser('1', dto, req);

      expect(result).toEqual({ id: '1', ...dto });
    });

    it('should forbid USER from updating others', async () => {
      const req = { user: { role: 'USER', id: '2' } };

      await expect(controller.updateUser('1', {} as any, req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteUser', () => {
    it('should allow ADMIN to delete user', async () => {
      mockUsersService.deleteUser.mockResolvedValue(undefined);

      const result = await controller.deleteUser('1');

      expect(service.deleteUser).toHaveBeenCalledWith('1');
      expect(result).toBeUndefined();
    });
  });
});