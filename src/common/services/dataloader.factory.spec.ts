import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataLoaderFactory } from './dataloader.factory';
import { User } from '../../modules/user/entities/user.entity';
import { Post } from '../../modules/post/entities/post.entity';
import { Comment } from '../../modules/comment/entities/comment.entity';
import { Profile } from '../../modules/profile/entities/profile.entity';

describe('DataLoaderFactory', () => {
  let factory: DataLoaderFactory;
  let userRepository: Repository<User>;
  let postRepository: Repository<Post>;
  let commentRepository: Repository<Comment>;
  let profileRepository: Repository<Profile>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataLoaderFactory,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Post),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Profile),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    factory = module.get<DataLoaderFactory>(DataLoaderFactory);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    postRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
    commentRepository = module.get<Repository<Comment>>(
      getRepositoryToken(Comment),
    );
    profileRepository = module.get<Repository<Profile>>(
      getRepositoryToken(Profile),
    );
  });

  it('should be defined', () => {
    expect(factory).toBeDefined();
  });

  describe('createLoaders', () => {
    it('should create a DataLoader registry with all loaders', () => {
      const loaders = factory.createLoaders();

      expect(loaders).toBeDefined();
      expect(loaders.userLoader).toBeDefined();
      expect(loaders.postLoader).toBeDefined();
      expect(loaders.commentLoader).toBeDefined();
      expect(loaders.postsByAuthorLoader).toBeDefined();
      expect(loaders.profileByUserIdLoader).toBeDefined();
    });
  });

  describe('User DataLoader', () => {
    it('should batch load users and maintain order', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'User',
          lastName: 'One',
        } as User,
        {
          id: 'user-2',
          email: 'user2@example.com',
          firstName: 'User',
          lastName: 'Two',
        } as User,
      ];

      jest.spyOn(userRepository, 'find').mockResolvedValue(mockUsers);

      const loaders = factory.createLoaders();
      const results = await loaders.userLoader.loadMany(['user-1', 'user-2']);

      expect(userRepository.find).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockUsers[0]);
      expect(results[1]).toEqual(mockUsers[1]);
    });

    it('should return null for missing users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'User',
          lastName: 'One',
        } as User,
      ];

      jest.spyOn(userRepository, 'find').mockResolvedValue(mockUsers);

      const loaders = factory.createLoaders();
      const results = await loaders.userLoader.loadMany(['user-1', 'user-999']);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockUsers[0]);
      expect(results[1]).toBeNull();
    });

    it('should deduplicate IDs in batch', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'User',
          lastName: 'One',
        } as User,
      ];

      jest.spyOn(userRepository, 'find').mockResolvedValue(mockUsers);

      const loaders = factory.createLoaders();
      // Request same ID multiple times
      const results = await loaders.userLoader.loadMany([
        'user-1',
        'user-1',
        'user-1',
      ]);

      expect(userRepository.find).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual(mockUsers[0]);
      expect(results[1]).toEqual(mockUsers[0]);
      expect(results[2]).toEqual(mockUsers[0]);
    });
  });

  describe('Post DataLoader', () => {
    it('should batch load posts and maintain order', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Post 1', content: 'Content 1' } as Post,
        { id: 'post-2', title: 'Post 2', content: 'Content 2' } as Post,
      ];

      jest.spyOn(postRepository, 'find').mockResolvedValue(mockPosts);

      const loaders = factory.createLoaders();
      const results = await loaders.postLoader.loadMany(['post-1', 'post-2']);

      expect(postRepository.find).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockPosts[0]);
      expect(results[1]).toEqual(mockPosts[1]);
    });

    it('should return null for missing posts', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Post 1', content: 'Content 1' } as Post,
      ];

      jest.spyOn(postRepository, 'find').mockResolvedValue(mockPosts);

      const loaders = factory.createLoaders();
      const results = await loaders.postLoader.loadMany(['post-1', 'post-999']);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockPosts[0]);
      expect(results[1]).toBeNull();
    });
  });

  describe('Comment DataLoader', () => {
    it('should batch load comments and maintain order', async () => {
      const mockComments = [
        { id: 'comment-1', content: 'Comment 1' } as Comment,
        { id: 'comment-2', content: 'Comment 2' } as Comment,
      ];

      jest.spyOn(commentRepository, 'find').mockResolvedValue(mockComments);

      const loaders = factory.createLoaders();
      const results = await loaders.commentLoader.loadMany([
        'comment-1',
        'comment-2',
      ]);

      expect(commentRepository.find).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockComments[0]);
      expect(results[1]).toEqual(mockComments[1]);
    });

    it('should return null for missing comments', async () => {
      const mockComments = [
        { id: 'comment-1', content: 'Comment 1' } as Comment,
      ];

      jest.spyOn(commentRepository, 'find').mockResolvedValue(mockComments);

      const loaders = factory.createLoaders();
      const results = await loaders.commentLoader.loadMany([
        'comment-1',
        'comment-999',
      ]);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockComments[0]);
      expect(results[1]).toBeNull();
    });
  });
});
