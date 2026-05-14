import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateViewClassAnalytics1779000000001
	implements MigrationInterface
{
	name = "CreateViewClassAnalytics1779000000001";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP MATERIALIZED VIEW IF EXISTS vw_class_analytics CASCADE`,
		);

		await queryRunner.query(`
            CREATE MATERIALIZED VIEW vw_class_analytics AS
            SELECT
                COALESCE(my_sr.id::text, t.id::text || '_none') AS unique_row_id,
                t.test_name,
                t.id AS test_id,
                my_sr.student_id,
                my_sr.score::float AS my_score,
                cs.avg_score::float AS class_avg_score,
                cs.max_score::float AS class_max_score,
                cs.min_score::float AS class_min_score,
                t.class_id,
                t.started_time,
                my_sr.created_at AS submission_time -- Thêm thời gian nộp để dễ sắp xếp
            FROM tests t
            LEFT JOIN student_results my_sr ON my_sr.exam_id = t.id AND my_sr.deleted_at IS NULL
            LEFT JOIN (
                SELECT
                    sr2.exam_id,
                    AVG(sr2.score)::float AS avg_score,
                    MAX(sr2.score)::float AS max_score,
                    MIN(sr2.score)::float AS min_score
                FROM student_results sr2
                WHERE sr2.deleted_at IS NULL
                GROUP BY sr2.exam_id
            ) cs ON cs.exam_id = t.id
            WHERE t.deleted_at IS NULL
        `);

		await queryRunner.query(`
            CREATE UNIQUE INDEX idx_vw_class_analytics_unique_id 
            ON vw_class_analytics (unique_row_id)
        `);

		await queryRunner.query(`
            CREATE INDEX idx_vw_class_analytics_search 
            ON vw_class_analytics (student_id, class_id)
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP MATERIALIZED VIEW IF EXISTS vw_class_analytics CASCADE`,
		);
	}
}
