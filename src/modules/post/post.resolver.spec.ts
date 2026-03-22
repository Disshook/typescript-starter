import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PostResolver } from './post.resolver';
import { PostService } from './post.service';
import { Post } from './entities/post.entity';
import { Tag } from '../tag/entities/tag.entity';
import { User } from '../user/entities/user.entity';
import { PostStatus } from './enums/post-status.enum';

describe('PostResolver', () => {
  let resolver: PostResolver;
  let postRepository: Repository<Post>;
  let tagRepository: Repository<Tag>;
  let postService: PostService;

  const mockPostRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockTagRepository = {
    findBy: jest.fn(),
  };

  const mockPostService = {
    findAll: jest.fn(),
    searchPosts: jest.fn(),
    publishPost: jest.fn(),
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: ['user'],
  } as User;

  const mockAdmin: User = {
    id: 'admin-1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    roles: ['admin'],
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostResolver,
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepository,
        },
        {
          provide: getRepositoryToken(Tag),
          useValue: mockTagRepository,
        },
        {
          provide: PostService,
          useValue: mockPostService,
        },
      ],
    }).compile();

    resolver = module.get<PostResolver>(PostResolver);
    postRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
    tagRepository = module.get<Repository<Tag>>(getRepositoryToken(Tag));
    postService = module.get<PostService>(PostService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPost', () => {
    it('should return a post and increment viewCount', async () => {
      const post = {
        id: '1',
        title: 'Test Post',
        viewCount: 5,
      } as Post;

      mockPostRepository.findOne.mockResolvedValue(post);
      mockPostRepository.save.mockResolvedValue({
        ...post,
        viewCount: 6,
      });

      const result = await resolver.getPost('1');

      expect(result.viewCount).toBe(6);
      expect(mockPostRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(resolver.getPost('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPosts', () => {
    it('should return paginated posts', async () => {
      const paginatedResult = {
        items: [{ id: '1', title: 'Post 1' }],
        pageInfo: {
          currentPage: 1,
          pageSize: 10,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      mockPostService.findAll.mockResolvedValue(paginatedResult);

      const result = await resolver.getPosts();

      expect(result).toEqual(paginatedResult);
      expect(mockPostService.findAll).toHaveBeenCalled();
    });
  });

  describe('searchPosts', () => {
    it('should search posts by text', async () => {
      const searchResult = {
        items: [{ id: '1', title: 'Test Post' }],
        pageInfo: {
          currentPage: 1,
          pageSize: 10,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      mockPostService.searchPosts.mockResolvedValue(searchResult);

      const result = await resolver.searchPosts('test');

      expect(result).toEqual(searchResult);
      expect(mockPostService.searchPosts).toHaveBeenCalledWith(
        'test',
        expect.any(Object),
      );
    });
  });

  describe('createPost', () => {
    it('should create a new post', async () => {
      const input = {
        title: 'New Post',
        content: 'Post content here',
        slug: 'new-post',
      };

      const createdPost = {
        id: '1',
        ...input,
        authorId: mockUser.id,
        viewCount: 0,
        status: PostStatus.DRAFT,
      } as Post;

      mockPostRepository.findOne.mockResolvedValue(null);
      mockPostRepository.create.mockReturnValue(createdPost);
      mockPostRepository.save.mockResolvedValue(createdPost);

      const result = await resolver.createPost(input, mockUser);

      expect(result.authorId).toBe(mockUser.id);
      expect(result.viewCount).toBe(0);
      expect(mockPostRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if slug already exists', async () => {
      const input = {
        title: 'New Post',
        content: 'Post content',
        slug: 'existing-slug',
      };

      mockPostRepository.findOne.mockResolvedValue({ id: '1' } as Post);

      await expect(resolver.createPost(input, mockUser)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should associate tags if tagIds provided', async () => {
      const input = {
        title: 'New Post',
        content: 'Post content',
        slug: 'new-post',
        tagIds: ['tag-1', 'tag-2'],
      };

      const tags = [
        { id: 'tag-1', name: 'Tag 1' },
        { id: 'tag-2', name: 'Tag 2' },
      ] as Tag[];

      const createdPost = {
        id: '1',
        title: input.title,
        content: input.content,
        slug: input.slug,
        authorId: mockUser.id,
      } as Post;

      mockPostRepository.findOne.mockResolvedValue(null);
      mockPostRepository.create.mockReturnValue(createdPost);
      mockPostRepository.save.mockResolvedValue(createdPost);
      mockTagRepository.findBy.mockResolvedValue(tags);

      await resolver.createPost(input, mockUser);

      expect(mockTagRepository.findBy).toHaveBeenCalled();
      expect(mockPostRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('updatePost', () => {
    it('should update a post owned by user', async () => {
      const post = {
        id: '1',
        title: 'Old Title',
        authorId: mockUser.id,
      } as Post;

      const input = { title: 'New Title' };

      mockPostRepository.findOne
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce({ ...post, ...input });
      mockPostRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await resolver.updatePost('1', input, mockUser);

      expect(result.title).toBe('New Title');
      expect(mockPostRepository.update).toHaveBeenCalled();
    });

    it('should allow admin to update any post', async () => {
      const post = {
        id: '1',
        title: 'Old Title',
        authorId: 'other-user',
      } as Post;

      const input = { title: 'New Title' };

      mockPostRepository.findOne
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce({ ...post, ...input });
      mockPostRepository.update.mockResolvedValue({ affected: 1 } as any);

      expect(mockPostRepository.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own post', async () => {
      const post = {
        id: '1',
        title: 'Old Title',
        authorId: 'other-user',
      } as Post;

      mockPostRepository.findOne.mockResolvedValue(post);

      await expect(
        resolver.updatePost('1', { title: 'New Title' }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(
        resolver.updatePost('999', { title: 'New Title' }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new slug already exists', async () => {
      const post = {
        id: '1',
        slug: 'old-slug',
        authorId: mockUser.id,
      } as Post;

      const existingPost = {
        id: '2',
        slug: 'new-slug',
      } as Post;

      mockPostRepository.findOne
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce(existingPost);

      await expect(
        resolver.updatePost('1', { slug: 'new-slug' }, mockUser),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deletePost', () => {
    it('should delete a post owned by user', async () => {
      const post = {
        id: '1',
        authorId: mockUser.id,
      } as Post;

      mockPostRepository.findOne.mockResolvedValue(post);
      mockPostRepository.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await resolver.deletePost('1', mockUser);

      expect(result).toBe(true);
      expect(mockPostRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should allow admin to delete any post', async () => {
      const post = {
        id: '1',
        authorId: 'other-user',
      } as Post;

      mockPostRepository.findOne.mockResolvedValue(post);
      mockPostRepository.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await resolver.deletePost('1', mockAdmin);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user does not own post', async () => {
      const post = {
        id: '1',
        authorId: 'other-user',
      } as Post;

      mockPostRepository.findOne.mockResolvedValue(post);

      await expect(resolver.deletePost('1', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(resolver.deletePost('999', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('publishPost', () => {
    it('should publish a post owned by user', async () => {
      const post = {
        id: '1',
        authorId: mockUser.id,
        status: PostStatus.DRAFT,
      } as Post;

      const publishedPost = {
        ...post,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
      } as Post;

      mockPostRepository.findOne.mockResolvedValue(post);
      mockPostService.publishPost.mockResolvedValue(publishedPost);

      const result = await resolver.publishPost('1', mockUser);

      expect(result.status).toBe(PostStatus.PUBLISHED);
      expect(mockPostService.publishPost).toHaveBeenCalledWith('1');
    });

    it('should throw ForbiddenException if user does not own post', async () => {
      const post = {
        id: '1',
        authorId: 'other-user',
      } as Post;

      mockPostRepository.findOne.mockResolvedValue(post);

      await expect(resolver.publishPost('1', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Field Resolvers', () => {
    it('should resolve author using DataLoader', async () => {
      const post = { id: '1', authorId: 'user-1' } as Post;
      const context = {
        loaders: {
          userLoader: {
            load: jest.fn().mockResolvedValue(mockUser),
          },
        },
      } as any;

      const result = await resolver.getAuthor(post, context);

      expect(result).toEqual(mockUser);
      expect(context.loaders.userLoader.load).toHaveBeenCalledWith('user-1');
    });

    it('should resolve comments using DataLoader', () => {
      const post = { id: '1' } as Post;
      const comments = [{ id: 'comment-1' }];
      const context = {
        loaders: {
          commentsByPostLoader: {
            load: jest.fn().mockResolvedValue(comments),
          },
        },
      } as any;

      const result = resolver.getComments(post, context);

      expect(context.loaders.commentsByPostLoader.load).toHaveBeenCalledWith(
        '1',
      );
    });

    it('should resolve tags', async () => {
      const post = { id: '1' } as Post;
      const tags = [{ id: 'tag-1', name: 'Tag 1' }] as Tag[];

      mockPostRepository.findOne.mockResolvedValue({
        ...post,
        tags,
      });

      const result = await resolver.getTags(post);

      expect(result).toEqual(tags);
    });
  });
});
