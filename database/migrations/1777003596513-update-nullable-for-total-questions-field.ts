import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateNullableForTotalQuestionsField1777003596513
	implements MigrationInterface
{
	name = "UpdateNullableForTotalQuestionsField1777003596513";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "tests" ALTER COLUMN "total_questions" DROP NOT NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "tests" ALTER COLUMN "total_questions" SET NOT NULL`,
		);
	}
}
