import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStudentResultsTable1777360157418
	implements MigrationInterface
{
	name = "UpdateStudentResultsTable1777360157418";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "student_results" ADD "student_answers" json NOT NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "student_results" DROP COLUMN "student_answers"`,
		);
	}
}
