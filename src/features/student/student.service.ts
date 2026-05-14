import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StudentResultEntity } from "../../database/entities/student-result.entity";

@Injectable()
export class StudentService {
	constructor(
		@InjectRepository(StudentResultEntity)
		private readonly studentResultRepository: Repository<StudentResultEntity>,
	) {}

	async getStudentResults(studentId: string) {
		return this.studentResultRepository
			.createQueryBuilder("sr")
			.leftJoin("sr.exam", "test")
			.leftJoin("test.class", "class")
			.select([
				'test.testName AS "testName"',
				'class.name AS "className"',
				'sr.id AS "id"',
				'sr.score AS "score"',
				'sr.timespent AS "timeSpent"',
				'test.startedTime AS "testDate"',
				'COALESCE(json_array_length(sr.fraud::json), 0) AS "fraudCount"',
				'sr.correctRate AS "correctRate"',
			])
			.where("sr.student_id = :studentId", { studentId })
			.getRawMany();
	}

	async getOverallTestResult(studentId: string) {
		return this.studentResultRepository
			.createQueryBuilder("r")
			.select("COUNT(r.id)", "totalTests")
			.addSelect("AVG(r.score)", "averageScore")
			.addSelect("MAX(r.score)", "highestScore")
			.addSelect("MIN(r.score)", "lowestScore")
			.where("r.student_id = :studentId", { studentId })
			.getRawOne();
	}

	async getClassAnalytics(studentId: string, classId: string) {
		const manager = this.studentResultRepository.manager;

		const rows: Array<{
			testName: string;
			myScore: number | null;
			classAvgScore: number;
			classMaxScore: number;
			classMinScore: number;
		}> = await manager.query(
			`
			SELECT
				t.test_name       AS "testName",
				my_sr.score       AS "myScore",
				cs.avg_score      AS "classAvgScore",
				cs.max_score      AS "classMaxScore",
				cs.min_score      AS "classMinScore"
			FROM tests t
			INNER JOIN classes c ON c.id = t.class_id
			LEFT JOIN student_results my_sr ON my_sr.exam_id = t.id AND my_sr.student_id = $1
			INNER JOIN (
				SELECT
					sr2.exam_id,
					AVG(sr2.score)::float AS avg_score,
					MAX(sr2.score)::float AS max_score,
					MIN(sr2.score)::float AS min_score
				FROM student_results sr2
				INNER JOIN tests t2 ON t2.id = sr2.exam_id
				WHERE t2.class_id = $2
				GROUP BY sr2.exam_id
			) cs ON cs.exam_id = t.id
			WHERE c.id = $2
			ORDER BY t.started_time ASC
			`,
			[studentId, classId],
		);

		return rows;
	}
}
