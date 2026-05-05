import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { plainToInstance } from "class-transformer";
import { Repository } from "typeorm";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { OverallResultResponseDto } from "./dto/overall-results-res.dto";
import { TestResultResponseDto } from "./dto/test-result-res.dto";

@Injectable()
export class StudentService {
	constructor(
		@InjectRepository(StudentResultEntity)
		private readonly studentResultRepository: Repository<StudentResultEntity>,
	) {}

	async getStudentResults(studentId: string) {
		const data = await this.studentResultRepository
			.createQueryBuilder("student_results")
			.leftJoin("student_results.exam", "test")
			.leftJoin("test.class", "class")
			.select([
				'test.testName AS "testName"',
				'class.name AS "className"',
				'student_results.id AS "id"',
				'student_results.score AS "score"',
				'test.startedTime AS "testDate"',
				// 'student_results.fraudCount AS "fraudCount"', //REFACTOR:OTA-70
			])
			// .addSelect(`
			//     (
			//         SELECT
			//             COUNT(*) FILTER (
			//                 WHERE (answer->>'is_correct')::boolean = true
			//             ) * 1.0 / NULLIF(COUNT(*), 0)
			//         FROM jsonb_array_elements(student_results.student_answers) AS answer
			//     )`, 'correctRate')      //REFACTOR:OTA-70   //- line 28 - 35
			.where("student_results.student_id = :studentId", { studentId })
			.getRawMany();

		return plainToInstance(TestResultResponseDto, data, {
			excludeExtraneousValues: true,
		});
	}

	async getOverallTestResult(studentId: string) {
		const result = await this.studentResultRepository
			.createQueryBuilder("r")
			.select("COUNT(r.id)", "totalTests")
			.addSelect("AVG(r.score)", "averageScore")
			.addSelect("MAX(r.score)", "highestScore")
			.addSelect("MIN(r.score)", "lowestScore")
			.where("r.student_id = :studentId", { studentId })
			.getRawOne();

		return plainToInstance(OverallResultResponseDto, result, {
			excludeExtraneousValues: true,
		});
	}
}
