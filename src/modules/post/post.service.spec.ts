import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PostService } from './post.service';
import { Post } from './entities/post.entity';
import { PostStatus } from './enums/post-status.enum';

describe('PostService', () => {
  let service: PostService;
  let repository: Repository<Post>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    repository = module.get<Repository<Post>>(getRepositoryToken(Post));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByIds', () => {
    it('should return posts in same order as input IDs', async () => {
      const post1 = { id: '1', title: 'Post 1' } as Post;
      const post2 = { id: '2', title: 'Post 2' } as Post;

      mockRepository.find.mockResolvedValue([post2, post1]);

      const result = await service.findByIds(['1', '2']);

      expect(result).toEqual([post1, post2]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { id: expect.anything() },
      });
    });

    it('should return null for missing posts', async () => {
      const post1 = { id: '1', title: 'Post 1' } as Post;

      mockRepository.find.mockResolvedValue([post1]);

      const result = await service.findByIds(['1', '2', '3']);

      expect(result).toEqual([post1, null, null]);
    });

    it('should deduplicate IDs', async () => {
      const post1 = { id: '1', title: 'Post 1' } as Post;

      mockRepository.find.mockResolvedValue([post1]);

      const result = await service.findByIds(['1', '1', '1']);

      expect(result).toEqual([post1, post1, post1]);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return paginated posts with metadata', async () => {
      const posts = [
        { id: '1', title: 'Post 1' },
        { id: '2', title: 'Post 2' },
      ] as Post[];

      const mockQueryBuilder = {
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([posts, 10]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({ page: 1, limit: 2 });

      expect(result.items).toEqual(posts);
      expect(result.pageInfo).toEqual({
        currentPage: 1,
        pageSize: 2,
        totalItems: 10,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should apply status filter', async () => {
      const mockQueryBuilder = {
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll(
        { page: 1, limit: 10 },
        { status: PostStatus.PUBLISHED },
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'post.status = :status',
        { status: PostStatus.PUBLISHED },
      );
    });

    it('should apply authorId filter', async () => {
      const mockQueryBuilder = {
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ page: 1, limit: 10 }, { authorId: 'user-123' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'post.authorId = :authorId',
        { authorId: 'user-123' },
      );
    });
  });

  describe('searchPosts', () => {
    it('should search posts by text', async () => {
      const posts = [{ id: '1', title: 'Test Post' }] as Post[];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([posts, 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.searchPosts('test', { page: 1, limit: 10 });

      expect(result.items).toEqual(posts);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'post.title LIKE :searchText',
        { searchText: '%test%' },
      );
      expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith(
        'post.content LIKE :searchText',
        { searchText: '%test%' },
      );
    });
  });

  describe('publishPost', () => {
    it('should publish a post and set publishedAt', async () => {
      const post = {
        id: '1',
        title: 'Test Post',
        status: PostStatus.DRAFT,
        publishedAt: null,
      } as Post;

      const publishedPost = {
        ...post,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(post);
      mockRepository.save.mockResolvedValue(publishedPost);

      const result = await service.publishPost('1');

      expect(result.status).toBe(PostStatus.PUBLISHED);
      expect(result.publishedAt).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if post not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.publishPost('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
