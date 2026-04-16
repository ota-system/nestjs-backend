import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthenFields1776134448841 implements MigrationInterface {
	name = "AddAuthenFields1776134448841";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."users_role_enum" AS ENUM('TEACHER', 'STUDENT')`,
		);
		await queryRunner.query(
			`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying(100) NOT NULL, "hashed_password" text, "google_id" character varying, "avatar_url" text, "email" character varying(100) NOT NULL, "role" "public"."users_role_enum", "provider" character varying(20) NOT NULL DEFAULT 'local', "isActive" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b" UNIQUE ("google_id"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_0bd5012aeb82628e07f6a1be53" ON "users" ("google_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_0bd5012aeb82628e07f6a1be53"`,
		);
		await queryRunner.query(`DROP TABLE "users"`);
		await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
	}
}
