import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTopicQuestionAndTestTable1776939486807
	implements MigrationInterface
{
	name = "CreateTopicQuestionAndTestTable1776939486807";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "level" character varying NOT NULL, "type" character varying NOT NULL, "question" character varying NOT NULL, "options" text, "answer" character varying NOT NULL, "explanation" character varying, "test_id" uuid NOT NULL, CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "topics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "topic_name" character varying NOT NULL, CONSTRAINT "PK_e4aa99a3fa60ec3a37d1fc4e853" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "tests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "test_name" character varying NOT NULL, "started_time" TIMESTAMP NOT NULL, "duration" integer NOT NULL, "antiCheating" boolean NOT NULL DEFAULT false, "total_questions" integer NOT NULL, "class_id" uuid NOT NULL, "topic_id" uuid NOT NULL, CONSTRAINT "PK_4301ca51edf839623386860aed2" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`ALTER TABLE "questions" ADD CONSTRAINT "FK_b1f107600ed9ed81aba56edfcea" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "tests" ADD CONSTRAINT "FK_af99930c4bdce16544496de5f7c" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "tests" ADD CONSTRAINT "FK_4b22828c64d868dbb3c3409bdb1" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "tests" DROP CONSTRAINT "FK_4b22828c64d868dbb3c3409bdb1"`,
		);
		await queryRunner.query(
			`ALTER TABLE "tests" DROP CONSTRAINT "FK_af99930c4bdce16544496de5f7c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "questions" DROP CONSTRAINT "FK_b1f107600ed9ed81aba56edfcea"`,
		);
		await queryRunner.query(`DROP TABLE "tests"`);
		await queryRunner.query(`DROP TABLE "topics"`);
		await queryRunner.query(`DROP TABLE "questions"`);
	}
}
