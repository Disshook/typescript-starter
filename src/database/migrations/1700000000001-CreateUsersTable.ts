import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUsersTable1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'passwordHash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'firstName',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'lastName',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'roles',
            type: 'varchar',
            length: '255',
            isNullable: false,
            default: "'user'",
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
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

    // Create index on email (unique constraint already creates an index, but explicit for clarity)
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_email',
        columnNames: ['email'],
      }),
    );

    // Create index on createdAt for sorting and filtering
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_createdAt',
        columnNames: ['createdAt'],
      }),
    );

    // Create index on updatedAt for sorting and filtering
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_updatedAt',
        columnNames: ['updatedAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex('users', 'IDX_users_updatedAt');
    await queryRunner.dropIndex('users', 'IDX_users_createdAt');
    await queryRunner.dropIndex('users', 'IDX_users_email');

    // Drop the table
    await queryRunner.dropTable('users');
  }
}
