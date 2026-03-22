import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateCommentsTable1700000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'comments',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'isEdited',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'authorId',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'postId',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'parentId',
            type: 'varchar',
            length: '36',
            isNullable: true,
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

    // Create index on postId for efficient post comment lookups
    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_comments_postId',
        columnNames: ['postId'],
      }),
    );

    // Create index on authorId for efficient author lookups
    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_comments_authorId',
        columnNames: ['authorId'],
      }),
    );

    // Create index on parentId for efficient nested reply lookups
    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_comments_parentId',
        columnNames: ['parentId'],
      }),
    );

    // Create foreign key to users table with CASCADE delete
    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        name: 'FK_comments_authorId',
        columnNames: ['authorId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create foreign key to posts table with CASCADE delete
    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        name: 'FK_comments_postId',
        columnNames: ['postId'],
        referencedTableName: 'posts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create self-referencing foreign key for nested replies with CASCADE delete
    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        name: 'FK_comments_parentId',
        columnNames: ['parentId'],
        referencedTableName: 'comments',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.dropForeignKey('comments', 'FK_comments_parentId');
    await queryRunner.dropForeignKey('comments', 'FK_comments_postId');
    await queryRunner.dropForeignKey('comments', 'FK_comments_authorId');

    // Drop indexes
    await queryRunner.dropIndex('comments', 'IDX_comments_parentId');
    await queryRunner.dropIndex('comments', 'IDX_comments_authorId');
    await queryRunner.dropIndex('comments', 'IDX_comments_postId');

    // Drop the table
    await queryRunner.dropTable('comments');
  }
}
