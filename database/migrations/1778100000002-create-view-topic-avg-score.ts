import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateViewTopicAvgScore1778100000002
	implements MigrationInterface
{
	name = "CreateViewTopicAvgScore1778100000002";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE OR REPLACE VIEW vw_topic_avg_score AS
			SELECT
				tp.id          AS topic_id,
				tp.topic_name  AS topic_name,
				t.class_id,
				ROUND(AVG(sr.score)::numeric, 2) AS avg_score
			FROM student_results sr
			INNER JOIN tests t  ON t.id  = sr.exam_id
			INNER JOIN topics tp ON tp.id = t.topic_id
			WHERE sr.deleted_at IS NULL
			GROUP BY tp.id, tp.topic_name, t.class_id
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP VIEW IF EXISTS vw_topic_avg_score`);
	}
}
