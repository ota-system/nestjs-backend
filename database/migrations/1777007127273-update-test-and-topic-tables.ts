import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTestAndTopicTables1777007127273
	implements MigrationInterface
{
	name = "UpdateTestAndTopicTables1777007127273";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "tests" DROP COLUMN "antiCheating"`);
		await queryRunner.query(
			`ALTER TABLE "tests" ADD "anti_cheating" boolean NOT NULL DEFAULT false`,
		);
		await queryRunner.query(
			`ALTER TABLE "topics" ADD CONSTRAINT "UQ_f2ad24c4081f790528294d64bde" UNIQUE ("topic_name")`,
		);
		await queryRunner.query(
			`ALTER TABLE "tests" ALTER COLUMN "total_questions" SET NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "tests" ALTER COLUMN "total_questions" SET DEFAULT '0'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "tests" ALTER COLUMN "total_questions" DROP DEFAULT`,
		);
		await queryRunner.query(
			`ALTER TABLE "tests" ALTER COLUMN "total_questions" DROP NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "topics" DROP CONSTRAINT "UQ_f2ad24c4081f790528294d64bde"`,
		);
		await queryRunner.query(`ALTER TABLE "tests" DROP COLUMN "anti_cheating"`);
		await queryRunner.query(
			`ALTER TABLE "tests" ADD "antiCheating" boolean NOT NULL DEFAULT false`,
		);
	}
}
