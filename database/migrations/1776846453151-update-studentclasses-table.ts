import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStudentclassesTable1776846453151
	implements MigrationInterface
{
	name = "UpdateStudentclassesTable1776846453151";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "student_classes" ADD "updated_at" TIMESTAMP DEFAULT now()`,
		);
		await queryRunner.query(
			`ALTER TABLE "student_classes" ADD "deleted_at" TIMESTAMP`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "student_classes" DROP COLUMN "deleted_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "student_classes" DROP COLUMN "updated_at"`,
		);
	}
}
