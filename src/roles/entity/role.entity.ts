
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { UserEntity } from '../../users/entity/user.entity';
@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // 'ADMIN', 'USER'

  @Column({ nullable: true })
  description?: string;

  @ManyToMany(() => UserEntity, (user) => user.roles)
  users: UserEntity[];
}
