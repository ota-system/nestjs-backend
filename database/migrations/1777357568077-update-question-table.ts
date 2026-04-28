import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateQuestionTable1777357568077 implements MigrationInterface {
	name = "UpdateQuestionTable1777357568077";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "answer"`);
		await queryRunner.query(`ALTER TABLE "questions" ADD "answer" text`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "answer"`);
		await queryRunner.query(
			`ALTER TABLE "questions" ADD "answer" character varying NOT NULL`,
		);
	}
}
