import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStudentResultFields1777962501094
	implements MigrationInterface
{
	name = "UpdateStudentResultFields1777962501094";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "student_results" ADD "time_spent" integer NOT NULL DEFAULT '0'`,
		);
		await queryRunner.query(
			`ALTER TABLE "student_results" ADD "correct_rate" double precision NOT NULL DEFAULT '0'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "student_results" DROP COLUMN "correct_rate"`,
		);
		await queryRunner.query(
			`ALTER TABLE "student_results" DROP COLUMN "time_spent"`,
		);
	}
}
