import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  Index,
} from 'typeorm';
import { Post } from '../../post/entities/post.entity';

@ObjectType()
@Entity('tags')
export class Tag {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ length: 50, unique: true })
  @Index()
  name: string;

  @Field()
  @Column({ length: 50, unique: true })
  @Index()
  slug: string;

  @Field({ nullable: true })
  @Column({ length: 500, nullable: true })
  description?: string;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => [Post])
  @ManyToMany(() => Post, (post) => post.tags)
  posts: Post[];
}
