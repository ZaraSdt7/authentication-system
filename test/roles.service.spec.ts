import { RoleEntity } from '../src/roles/entity/role.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RolesService } from '../src/roles/service/role.service';
import { Repository } from 'typeorm';
import { UserEntity } from '../src/users/entity/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('RolesService', () => {
  let service: RolesService;
  let roleRepo: jest.Mocked<Repository<RoleEntity>>;
  let userRepo: jest.Mocked<Repository<UserEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getRepositoryToken(RoleEntity), useValue: createMockRepo<RoleEntity>() },
        { provide: getRepositoryToken(UserEntity), useValue: createMockRepo<UserEntity>() },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    roleRepo = module.get(getRepositoryToken(RoleEntity));
    userRepo = module.get(getRepositoryToken(UserEntity));

    jest.clearAllMocks();
  });

  function createMockRepo<T>() {
    return {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    } as any;
  }

  describe('createRole', () => {
    it('should throw if role already exists', async () => {
      roleRepo.findOne.mockResolvedValue({ id: 1, name: 'ADMIN' } as RoleEntity);

      await expect(service.createRole('ADMIN')).rejects.toThrow(BadRequestException);
    });

    it('should create and save a role', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      roleRepo.create.mockReturnValue({ name: 'USER' } as RoleEntity);
      roleRepo.save.mockResolvedValue({ id: 1, name: 'USER' } as RoleEntity);

      const result = await service.createRole('USER');

      expect(roleRepo.create).toHaveBeenCalledWith({ name: 'USER', description: undefined });
      expect(result).toEqual({ id: 1, name: 'USER' });
    });
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      roleRepo.find.mockResolvedValue([{ id: 1, name: 'ADMIN' }] as RoleEntity[]);

      const result = await service.findAll();

      expect(result).toEqual([{ id: 1, name: 'ADMIN' }]);
    });
  });

  describe('assignRoleToUser', () => {
    it('should throw if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.assignRoleToUser(1, 'ADMIN')).rejects.toThrow(NotFoundException);
    });

    it('should throw if role not found', async () => {
      userRepo.findOne.mockResolvedValue({ id: '1', roles: [] } as any);
      roleRepo.findOne.mockResolvedValue(null);

      await expect(service.assignRoleToUser(1, 'ADMIN')).rejects.toThrow(NotFoundException);
    });

    it('should throw if user already has role', async () => {
      userRepo.findOne.mockResolvedValue({ id: '1', roles: [{ id: 1, name: 'ADMIN' }] } as  any );
      roleRepo.findOne.mockResolvedValue({ id: 1, name: 'ADMIN' } as RoleEntity);

      await expect(service.assignRoleToUser(1, 'ADMIN')).rejects.toThrow(BadRequestException);
    });

    it('should assign role to user successfully', async () => {
      const user = { id: '1', roles: [] } as any;
      const role = { id: 2, name: 'USER' } as RoleEntity;

      userRepo.findOne.mockResolvedValue(user);
      roleRepo.findOne.mockResolvedValue(role);
      userRepo.save.mockResolvedValue({ ...user, roles: [role] });

      const result = await service.assignRoleToUser(1, 'USER');

      expect(userRepo.save).toHaveBeenCalledWith({ ...user, roles: [role] });
      expect(result.roles).toContain(role);
    });
  });
});