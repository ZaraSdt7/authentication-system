import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('refresh-token')
export class RefreshTokenEntity 
{
      @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  user: UserEntity;

  @Column()
  hashedToken: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}