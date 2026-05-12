import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStudentClassGpaToMaterializedView1778580712006
	implements MigrationInterface
{
	name = "UpdateStudentClassGpaToMaterializedView1778580712006";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP VIEW IF EXISTS vw_student_class_gpa`);

		await queryRunner.query(`
			CREATE MATERIALIZED VIEW vw_student_class_gpa AS
			SELECT
				sr.student_id,
				t.class_id,
				ROUND(AVG(sr.score)::numeric, 2) AS gpa
			FROM student_results sr
			INNER JOIN tests t ON t.id = sr.exam_id
			WHERE sr.deleted_at IS NULL
			GROUP BY sr.student_id, t.class_id
		`);

		await queryRunner.query(`
			CREATE UNIQUE INDEX CONCURRENTLY idx_vw_student_class_gpa_unique
			ON vw_student_class_gpa (student_id, class_id)
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX IF EXISTS idx_vw_student_class_gpa_unique`,
		);

		await queryRunner.query(
			`DROP MATERIALIZED VIEW IF EXISTS vw_student_class_gpa`,
		);

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
}
