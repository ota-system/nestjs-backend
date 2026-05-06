import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StudentResultEntity } from "../../database/entities/student-result.entity";

@Injectable()
export class StudentResultService {
	constructor(
		@InjectRepository(StudentResultEntity)
		private readonly repo: Repository<StudentResultEntity>,
	) {}

	async getStudentAttemptedTests(
		studentId: string,
		testIds: string[],
	): Promise<Set<string>> {
		if (testIds.length === 0) return new Set();

		const qb = this.repo
			.createQueryBuilder("result")
			.select("result.exam_id", "exam_id")
			.where("result.student_id = :studentId", { studentId });

		if (testIds.length === 1) {
			const row = await qb
				.andWhere("result.exam_id = :testId", { testId: testIds[0] })
				.getRawOne();
			return new Set(row ? [row.exam_id] : []);
		} else {
			const rows = await qb
				.andWhere("result.exam_id IN (:...testIds)", { testIds })
				.getRawMany();
			return new Set(rows.map((r) => r.exam_id));
		}
	}
}
