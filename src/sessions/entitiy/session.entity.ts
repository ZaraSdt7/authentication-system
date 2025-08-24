import { UserEntity } from '../../users/entity/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';


@Entity('sessions')
@Index(['userId', 'revoked'])
@Index(['userId', 'expiresAt'])
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36 })
  @Index()
  userId: string;

  @ManyToOne(() => UserEntity, (users) => users.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  // Hash of the refresh token (never store the raw token)
  @Column({ type: 'varchar', length: 255 })
  refreshTokenHash: string;

  // Token family ID for abuse detection and revocation
  @Column({ type: 'char', length: 36 })
  @Index()
  tokenFamilyId: string;

  // Device/user information
  @Column({ type: 'varchar', length: 45, nullable: true })
  ip?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent?: string;

  // status flags
  @Column({ type: 'boolean', default: true })
  isValid: boolean;

  @Column({ type: 'boolean', default: false })
  revoked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
