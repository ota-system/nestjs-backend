import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateClassCodeUnique1776682247425 implements MigrationInterface {
	name = "UpdateClassCodeUnique1776682247425";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "classes" ADD CONSTRAINT "UQ_cf7491878e0fca8599438629988" UNIQUE ("code")`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "classes" DROP CONSTRAINT "UQ_cf7491878e0fca8599438629988"`,
		);
	}
}
