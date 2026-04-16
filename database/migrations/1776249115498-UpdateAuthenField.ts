import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAuthenField1776249115498 implements MigrationInterface {
	name = "UpdateAuthenField1776249115498";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."IDX_0bd5012aeb82628e07f6a1be53"`,
		);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "full_name"`);
		await queryRunner.query(
			`ALTER TABLE "users" DROP COLUMN "hashed_password"`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" DROP CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b"`,
		);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "full-name" character varying(100) NOT NULL`,
		);
		await queryRunner.query(`ALTER TABLE "users" ADD "hashed-password" text`);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "google-id" character varying`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ADD CONSTRAINT "UQ_c7fb565aa5b6f2d13f66cd062df" UNIQUE ("google-id")`,
		);
		await queryRunner.query(`ALTER TABLE "users" ADD "avatar-url" text`);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
		await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "role" character varying(50)`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_c7fb565aa5b6f2d13f66cd062d" ON "users" ("google-id") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."IDX_c7fb565aa5b6f2d13f66cd062d"`,
		);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
		await queryRunner.query(
			`CREATE TYPE "public"."users_role_enum" AS ENUM('TEACHER', 'STUDENT')`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "role" "public"."users_role_enum"`,
		);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar-url"`);
		await queryRunner.query(
			`ALTER TABLE "users" DROP CONSTRAINT "UQ_c7fb565aa5b6f2d13f66cd062df"`,
		);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google-id"`);
		await queryRunner.query(
			`ALTER TABLE "users" DROP COLUMN "hashed-password"`,
		);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "full-name"`);
		await queryRunner.query(`ALTER TABLE "users" ADD "avatar_url" text`);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "google_id" character varying`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ADD CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b" UNIQUE ("google_id")`,
		);
		await queryRunner.query(`ALTER TABLE "users" ADD "hashed_password" text`);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "full_name" character varying(100) NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_0bd5012aeb82628e07f6a1be53" ON "users" ("google_id") `,
		);
	}
}
