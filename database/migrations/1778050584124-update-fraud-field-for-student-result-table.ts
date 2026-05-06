import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFraudFieldForStudentResultTable1778050584124
	implements MigrationInterface
{
	name = "UpdateFraudFieldForStudentResultTable1778050584124";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "student_results" ADD "fraud" json`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "student_results" DROP COLUMN "fraud"`,
		);
	}
}
