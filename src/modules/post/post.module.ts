import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Tag } from '../tag/entities/tag.entity';
import { PostService } from './post.service';
import { PostResolver } from './post.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Tag])],
  providers: [PostService, PostResolver],
  exports: [TypeOrmModule, PostService],
})
export class PostModule {}
