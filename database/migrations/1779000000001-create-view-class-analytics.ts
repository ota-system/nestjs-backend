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
                t.id AS test_id,
                t.test_name,
                t.class_id,
                t.started_time,
                cs.avg_score::float AS class_avg_score,
                cs.max_score::float AS class_max_score,
                cs.min_score::float AS class_min_score
            FROM tests t
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
            CREATE UNIQUE INDEX idx_vw_class_analytics_test_id 
            ON vw_class_analytics (test_id)
        `);

		await queryRunner.query(`
            CREATE INDEX idx_vw_class_analytics_class 
            ON vw_class_analytics (class_id)
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP MATERIALIZED VIEW IF EXISTS vw_class_analytics CASCADE`,
		);
	}
}
