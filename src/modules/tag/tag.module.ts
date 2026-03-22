import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { Post } from '../post/entities/post.entity';
import { TagResolver } from './tag.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, Post])],
  providers: [TagResolver],
  exports: [TypeOrmModule],
})
export class TagModule {}
