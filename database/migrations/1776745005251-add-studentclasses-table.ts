import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStudentclassesTable1776745005251 implements MigrationInterface {
	name = "AddStudentclassesTable1776745005251";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."IDX_c7fb565aa5b6f2d13f66cd062d"`,
		);
		await queryRunner.query(
			`CREATE TABLE "student_classes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "status" character varying NOT NULL DEFAULT 'active', "student_id" uuid, "class_id" uuid, CONSTRAINT "PK_e6fcc2e4f8f79a5aa16a50c8f46" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isActive"`);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "full-name"`);
		await queryRunner.query(
			`ALTER TABLE "users" DROP COLUMN "hashed-password"`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" DROP CONSTRAINT "UQ_c7fb565aa5b6f2d13f66cd062df"`,
		);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google-id"`);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar-url"`);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "full_name" character varying(100) NOT NULL`,
		);
		await queryRunner.query(`ALTER TABLE "users" ADD "hashed_password" text`);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "google_id" character varying`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ADD CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b" UNIQUE ("google_id")`,
		);
		await queryRunner.query(`ALTER TABLE "users" ADD "avatar_url" text`);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "is_active" boolean NOT NULL DEFAULT true`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_0bd5012aeb82628e07f6a1be53" ON "users" ("google_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "student_classes" ADD CONSTRAINT "FK_09b94eccbdedd86b77d54daaeb8" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "student_classes" ADD CONSTRAINT "FK_250de2754beaff18091a60a6654" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "student_classes" DROP CONSTRAINT "FK_250de2754beaff18091a60a6654"`,
		);
		await queryRunner.query(
			`ALTER TABLE "student_classes" DROP CONSTRAINT "FK_09b94eccbdedd86b77d54daaeb8"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_0bd5012aeb82628e07f6a1be53"`,
		);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
		await queryRunner.query(
			`ALTER TABLE "users" DROP CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b"`,
		);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`);
		await queryRunner.query(
			`ALTER TABLE "users" DROP COLUMN "hashed_password"`,
		);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "full_name"`);
		await queryRunner.query(`ALTER TABLE "users" ADD "avatar-url" text`);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "google-id" character varying`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ADD CONSTRAINT "UQ_c7fb565aa5b6f2d13f66cd062df" UNIQUE ("google-id")`,
		);
		await queryRunner.query(`ALTER TABLE "users" ADD "hashed-password" text`);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "full-name" character varying(100) NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "isActive" boolean NOT NULL DEFAULT true`,
		);
		await queryRunner.query(`DROP TABLE "student_classes"`);
		await queryRunner.query(
			`CREATE INDEX "IDX_c7fb565aa5b6f2d13f66cd062d" ON "users" ("google-id") `,
		);
	}
}
