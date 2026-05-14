import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateViewStudentClassGpa1778100000001
	implements MigrationInterface
{
	name = "CreateViewStudentClassGpa1778100000001";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE OR REPLACE VIEW vw_student_class_gpa AS
			SELECT
				sr.student_id,
				t.class_id,
				ROUND(AVG(sr.score)::numeric, 2) AS gpa
			FROM student_results sr
			INNER JOIN tests t ON t.id = sr.exam_id
			WHERE sr.deleted_at IS NULL
			GROUP BY sr.student_id, t.class_id
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP VIEW IF EXISTS vw_student_class_gpa`);
	}
}
