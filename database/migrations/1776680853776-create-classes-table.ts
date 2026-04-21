import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClassesTable1776680853776 implements MigrationInterface {
	name = "CreateClassesTable1776680853776";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "classes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "subject" character varying NOT NULL, "code" character varying NOT NULL, "teacher_id" uuid, CONSTRAINT "PK_e207aa15404e9b2ce35910f9f7f" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`ALTER TABLE "classes" ADD CONSTRAINT "FK_b34c92e413c4debb6e0f23fed46" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "classes" DROP CONSTRAINT "FK_b34c92e413c4debb6e0f23fed46"`,
		);
		await queryRunner.query(`DROP TABLE "classes"`);
	}
}
