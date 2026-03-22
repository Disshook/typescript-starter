import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeEmailNullable1700000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` MODIFY COLUMN \`email\` VARCHAR(255) NULL DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` MODIFY COLUMN \`email\` VARCHAR(255) NOT NULL`,
    );
  }
}
