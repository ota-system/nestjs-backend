import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateClassTeacherConstraint1776736058511
	implements MigrationInterface
{
	name = "UpdateClassTeacherConstraint1776736058511";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "classes" DROP CONSTRAINT "FK_b34c92e413c4debb6e0f23fed46"`,
		);
		await queryRunner.query(
			`ALTER TABLE "classes" ALTER COLUMN "teacher_id" SET NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "classes" ADD CONSTRAINT "FK_b34c92e413c4debb6e0f23fed46" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "classes" DROP CONSTRAINT "FK_b34c92e413c4debb6e0f23fed46"`,
		);
		await queryRunner.query(
			`ALTER TABLE "classes" ALTER COLUMN "teacher_id" DROP NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "classes" ADD CONSTRAINT "FK_b34c92e413c4debb6e0f23fed46" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}
}
