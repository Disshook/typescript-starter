import { registerEnumType } from '@nestjs/graphql';

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

registerEnumType(PostStatus, {
  name: 'PostStatus',
  description: 'The status of a post',
});
