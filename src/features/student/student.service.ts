import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { PageParams } from "../../shared/types/page-param.type";

@Injectable()
export class StudentService {
	constructor(
		@InjectRepository(StudentResultEntity)
		private readonly studentResultRepository: Repository<StudentResultEntity>,
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
}
