import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from './entity/role.entity';
import { UserEntity } from '../users/entity/user.entity';
import { RolesService } from './service/role.service';


@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity, UserEntity])],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
