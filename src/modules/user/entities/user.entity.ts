import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ nullable: true })
  @Column({ unique: true, length: 255, nullable: true, default: null })
  @Index()
  email: string | null;

  @Column({ length: 255 })
  passwordHash: string;

  @Field()
  @Column({ length: 100 })
  firstName: string;

  @Field()
  @Column({ length: 100 })
  lastName: string;

  @Field(() => [String])
  @Column({
    type: 'varchar',
    length: 255,
    default: 'user',
    transformer: {
      to: (value: string[]) => value.join(','),
      from: (value: string | string[]) =>
        Array.isArray(value) ? value : value.split(','),
    },
  })
  roles: string[];

  @Field({ nullable: true })
  @Column({ length: 20, nullable: true, default: null })
  mobile: string | null;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field(() => Date)
  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  @Index()
  updatedAt: Date;

  @Field(() => require('../../post/entities/post.entity').Post, {
    nullable: true,
  })
  @OneToMany(
    () => require('../../post/entities/post.entity').Post,
    (post: any) => post.author,
  )
  posts: any[];

  @Field(() => require('../../comment/entities/comment.entity').Comment, {
    nullable: true,
  })
  @OneToMany(
    () => require('../../comment/entities/comment.entity').Comment,
    (comment: any) => comment.author,
  )
  comments: any[];

  @Field(() => require('../../profile/entities/profile.entity').Profile, {
    nullable: true,
  })
  @OneToOne(
    () => require('../../profile/entities/profile.entity').Profile,
    (profile: any) => profile.user,
    { cascade: true },
  )
  profile?: any;
}
