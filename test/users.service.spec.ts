import { Test, TestingModule } from '@nestjs/testing';
import { UserEntity } from '../src/users/entity/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Repository, ObjectLiteral } from 'typeorm';
import { UsersService } from '../src/users/service/user.service';

type MockRepo<T extends ObjectLiteral = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UsersService', () => {
  let service: UsersService;
  let repo: MockRepo<UserEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(UserEntity));
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const dto = { phoneNumber: '0912000000', name: 'Zahra' } as any;

      (repo.findOne as jest.Mock).mockResolvedValue(null);
      (repo.create as jest.Mock).mockReturnValue(dto);
      (repo.save as jest.Mock).mockResolvedValue({ id: '1', ...dto });

      const result = await service.createUser(dto);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { phoneNumber: dto.phoneNumber } });
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: '1', ...dto });
    });

    it('should throw ConflictException if phone already exists', async () => {
      const dto = { phoneNumber: '0912000000' } as any;

      (repo.findOne as jest.Mock).mockResolvedValue({ id: '1', ...dto });

      await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerErrorException if save fails', async () => {
      const dto = { phoneNumber: '0912000000' } as any;

      (repo.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.createUser(dto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getUserByPhone', () => {
    it('should return user', async () => {
      const user = { id: '1', phoneNumber: '0912' } as any;
      (repo.findOne as jest.Mock).mockResolvedValue(user);

      const result = await service.getUserByPhone('0912');

      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if not exists', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getUserByPhone('0912')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const dto = { name: 'new name' } as any;
      const user = { id: '1', phoneNumber: '0912', name: 'old' } as any;

      (repo.findOne as jest.Mock).mockResolvedValue(user);
      (repo.save as jest.Mock).mockResolvedValue({ ...user, ...dto });

      const result = await service.updateUser('1', dto);

      expect(result).toEqual({ id: '1', phoneNumber: '0912', name: 'new name' });
    });

    it('should throw NotFoundException if user not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.updateUser('1', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      (repo.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      await service.deleteUser('1');

      expect(repo.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if user not found', async () => {
      (repo.delete as jest.Mock).mockResolvedValue({ affected: 0 });

      await expect(service.deleteUser('1')).rejects.toThrow(NotFoundException);
    });
  });
});
