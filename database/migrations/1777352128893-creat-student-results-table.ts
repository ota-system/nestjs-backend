import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatStudentResultsTable1777352128893
	implements MigrationInterface
{
	name = "CreatStudentResultsTable1777352128893";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "student_results" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "score" double precision NOT NULL DEFAULT '0', "mistakes" json, "student_id" uuid NOT NULL, "exam_id" uuid NOT NULL, CONSTRAINT "PK_7548d4336e1a4f5026bacafe647" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ALTER COLUMN "updated_at" DROP NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "student_results" ADD CONSTRAINT "FK_3d6dfc13c477c7c12ee4c5bcd6b" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "student_results" ADD CONSTRAINT "FK_c083e3130351f7203b3dfba227e" FOREIGN KEY ("exam_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "student_results" DROP CONSTRAINT "FK_c083e3130351f7203b3dfba227e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "student_results" DROP CONSTRAINT "FK_3d6dfc13c477c7c12ee4c5bcd6b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ALTER COLUMN "updated_at" SET NOT NULL`,
		);
		await queryRunner.query(`DROP TABLE "student_results"`);
	}
}
