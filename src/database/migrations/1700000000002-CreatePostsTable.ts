import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreatePostsTable1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'posts',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
            default: "'DRAFT'",
            isNullable: false,
          },
          {
            name: 'viewCount',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'publishedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'authorId',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create index on slug (unique constraint already creates an index, but explicit for clarity)
    await queryRunner.createIndex(
      'posts',
      new TableIndex({
        name: 'IDX_posts_slug',
        columnNames: ['slug'],
      }),
    );

    // Create index on authorId for efficient author lookups
    await queryRunner.createIndex(
      'posts',
      new TableIndex({
        name: 'IDX_posts_authorId',
        columnNames: ['authorId'],
      }),
    );

    // Create index on status for filtering by post status
    await queryRunner.createIndex(
      'posts',
      new TableIndex({
        name: 'IDX_posts_status',
        columnNames: ['status'],
      }),
    );

    // Create index on publishedAt for sorting and filtering published posts
    await queryRunner.createIndex(
      'posts',
      new TableIndex({
        name: 'IDX_posts_publishedAt',
        columnNames: ['publishedAt'],
      }),
    );

    // Create foreign key to users table with CASCADE delete
    await queryRunner.createForeignKey(
      'posts',
      new TableForeignKey({
        name: 'FK_posts_authorId',
        columnNames: ['authorId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key first
    await queryRunner.dropForeignKey('posts', 'FK_posts_authorId');

    // Drop indexes
    await queryRunner.dropIndex('posts', 'IDX_posts_publishedAt');
    await queryRunner.dropIndex('posts', 'IDX_posts_status');
    await queryRunner.dropIndex('posts', 'IDX_posts_authorId');
    await queryRunner.dropIndex('posts', 'IDX_posts_slug');

    // Drop the table
    await queryRunner.dropTable('posts');
  }
}
