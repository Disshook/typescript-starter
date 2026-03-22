import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateTagsAndPostTagsTables1700000000005
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tags table
    await queryRunner.createTable(
      new Table({
        name: 'tags',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes on name and slug for tags table
    await queryRunner.createIndex(
      'tags',
      new TableIndex({
        name: 'IDX_tags_name',
        columnNames: ['name'],
      }),
    );

    await queryRunner.createIndex(
      'tags',
      new TableIndex({
        name: 'IDX_tags_slug',
        columnNames: ['slug'],
      }),
    );

    // Create post_tags junction table
    await queryRunner.createTable(
      new Table({
        name: 'post_tags',
        columns: [
          {
            name: 'postsId',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'tagsId',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes on both foreign keys for efficient lookups
    await queryRunner.createIndex(
      'post_tags',
      new TableIndex({
        name: 'IDX_post_tags_postsId',
        columnNames: ['postsId'],
      }),
    );

    await queryRunner.createIndex(
      'post_tags',
      new TableIndex({
        name: 'IDX_post_tags_tagsId',
        columnNames: ['tagsId'],
      }),
    );

    // Create foreign key to posts table with CASCADE delete
    await queryRunner.createForeignKey(
      'post_tags',
      new TableForeignKey({
        name: 'FK_post_tags_postsId',
        columnNames: ['postsId'],
        referencedTableName: 'posts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create foreign key to tags table with CASCADE delete
    await queryRunner.createForeignKey(
      'post_tags',
      new TableForeignKey({
        name: 'FK_post_tags_tagsId',
        columnNames: ['tagsId'],
        referencedTableName: 'tags',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys from post_tags table
    await queryRunner.dropForeignKey('post_tags', 'FK_post_tags_tagsId');
    await queryRunner.dropForeignKey('post_tags', 'FK_post_tags_postsId');

    // Drop indexes from post_tags table
    await queryRunner.dropIndex('post_tags', 'IDX_post_tags_tagsId');
    await queryRunner.dropIndex('post_tags', 'IDX_post_tags_postsId');

    // Drop post_tags junction table
    await queryRunner.dropTable('post_tags');

    // Drop indexes from tags table
    await queryRunner.dropIndex('tags', 'IDX_tags_slug');
    await queryRunner.dropIndex('tags', 'IDX_tags_name');

    // Drop tags table
    await queryRunner.dropTable('tags');
  }
}
