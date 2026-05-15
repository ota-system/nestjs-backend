import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { ClassAnalyticsView } from "../../database/views/class-analytics.view";
import { PageParams } from "../../shared/types/page-param.type";

@Injectable()
export class StudentService {
	constructor(
		@InjectRepository(StudentResultEntity)
		private readonly studentResultRepository: Repository<StudentResultEntity>,
		@InjectRepository(ClassAnalyticsView)
		private readonly classAnalyticsRepository: Repository<ClassAnalyticsView>,
	) {}

	async getStudentResults(studentId: string, pagination: PageParams) {
		const { page = 1, limit = 10 } = pagination;
		const skip = (page - 1) * limit;

		const query = this.studentResultRepository
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
			.orderBy("test.startedTime", "DESC")
			.addOrderBy("sr.createdAt", "DESC");

		const total = await query.getCount();
		const data = await query.offset(skip).limit(limit).getRawMany();

		return {
			data,
			metadata: { page, limit, totalPages: Math.ceil(total / limit) },
		};
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
		return this.classAnalyticsRepository
			.createQueryBuilder("analytics")
			.leftJoin(
				StudentResultEntity,
				"sr",
				"sr.exam_id = analytics.test_id AND sr.student_id = :studentId AND sr.deleted_at IS NULL",
				{ studentId },
			)
			.select([
				'analytics.testName AS "testName"',
				'MAX(sr.score) AS "myScore"',
				'analytics.classAvgScore AS "classAvgScore"',
				'analytics.classMaxScore AS "classMaxScore"',
				'analytics.classMinScore AS "classMinScore"',
			])
			.where("analytics.class_id = :classId", { classId })
			.groupBy("analytics.test_id")
			.addGroupBy("analytics.testName")
			.addGroupBy("analytics.classAvgScore")
			.addGroupBy("analytics.classMaxScore")
			.addGroupBy("analytics.classMinScore")
			.addGroupBy("analytics.startedTime")
			.orderBy("analytics.startedTime", "ASC")
			.getRawMany();
	}
}
