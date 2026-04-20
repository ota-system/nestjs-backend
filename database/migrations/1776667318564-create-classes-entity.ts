import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClassesEntity1776667318564 implements MigrationInterface {
	name = "CreateClassesEntity1776667318564";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "class" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "subject" character varying NOT NULL, "code" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "teacher_id" uuid, CONSTRAINT "PK_0b9024d21bdfba8b1bd1c300eae" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`ALTER TABLE "class" ADD CONSTRAINT "FK_c24cc47b50016cb7ec5a0716ee5" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "class" DROP CONSTRAINT "FK_c24cc47b50016cb7ec5a0716ee5"`,
		);
		await queryRunner.query(`DROP TABLE "class"`);
	}
}
