import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RoleEntity } from "../entity/role.entity";
import { UserEntity } from '../../users/entity/user.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async createRole(name: string, description?: string): Promise<RoleEntity> {
    const exists = await this.roleRepo.findOne({ where: { name } });
    if (exists) throw new BadRequestException('Role already exists');
    const role = this.roleRepo.create({ name, description });
    return this.roleRepo.save(role);
  }

  async findAll(): Promise<RoleEntity[]> {
    return this.roleRepo.find();
  }

  async assignRoleToUser(userId: number, roleName: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: { id: String(userId) },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('User not found');

    const role = await this.roleRepo.findOne({ where: { name: roleName } });
    if (!role) throw new NotFoundException('Role not found');

    if (user.roles.find((r) => r.name === roleName)) {
      throw new BadRequestException('User already has this role');
    }

    user.roles.push(role);
    return this.userRepo.save(user);
  }
}