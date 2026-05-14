import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChoicesTable1778656084599 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE "choices" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "deleted_at" TIMESTAMP, 
                "answer" character varying NOT NULL, 
                "is_correct" boolean NOT NULL DEFAULT false, 
                "question_id" uuid NOT NULL, 
                CONSTRAINT "PK_choices_id" PRIMARY KEY ("id")
            )
        `);
		await queryRunner.query(`
            ALTER TABLE "choices" 
            ADD CONSTRAINT "FK_choices_question_id" 
            FOREIGN KEY ("question_id") 
            REFERENCES "questions"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "choices" DROP CONSTRAINT "FK_choices_question_id"`,
		);
		await queryRunner.query(`DROP TABLE "choices"`);
	}
}
