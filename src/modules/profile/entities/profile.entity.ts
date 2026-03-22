import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@ObjectType()
@Entity('profiles')
export class Profile {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  bio?: string;

  @Field({ nullable: true })
  @Column({ length: 255, nullable: true })
  avatarUrl?: string;

  @Field({ nullable: true })
  @Column({ length: 255, nullable: true })
  website?: string;

  @Field({ nullable: true })
  @Column({ length: 100, nullable: true })
  location?: string;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'date', nullable: true })
  birthDate?: Date;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => User)
  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid', { unique: true })
  @Index()
  userId: string;
}
