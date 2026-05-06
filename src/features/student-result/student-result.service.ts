import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { plainToInstance } from "class-transformer";
import { Repository } from "typeorm";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { AccessForbiddenException } from "../../shared/exception/access-forbidden.exception";
import { BaseException } from "../../shared/exception/base.exception";
import { UserRole } from "../../shared/types/user-role.enum";
import { AccessJwtPayload } from "../auth/auth.type";
import { StudentResultResponse } from "./dtos/student-result-res.dto";

@Injectable()
export class StudentResultService {
	constructor(
		@InjectRepository(StudentResultEntity)
		private readonly studentResultRepository: Repository<StudentResultEntity>,
	) {}

	async getTestResultInfo(
		studentResultId: string,
		currentUser: AccessJwtPayload,
	) {
		const result = await this.studentResultRepository.findOne({
			where: { id: studentResultId },
			relations: [
				"exam",
				"exam.topic",
				"exam.class",
				"exam.class.teacher",
				"exam.questions",
				"student",
			],
		});

		if (!result) throw new BaseException(404, "STUDENT_RESULT_NOT_FOUND");
		await this.validateAccess(currentUser, result);

		const answerMap = new Map(
			result.studentAnswers.map((a) => [a.questionId, a.isCorrect]),
		);

		const plainData = {
			testResultInfo: {
				testResultId: result.id,
				testName: result.exam.testName,
				teacherName: result.exam.class.teacher.fullName,
				completedAt: result.createdAt,
				topic: result.exam.topic.topicName,
				totalQuestions: result.exam.totalQuestions,
				score: result.score,
				correctRate: result.correctRate,
			},
			questionResults:
				result.exam.questions?.map((q) => ({
					questionId: q.id,
					isCorrect: answerMap.get(q.id) ?? null,
				})) || [],
		};

		return plainToInstance(StudentResultResponse, plainData, {
			excludeExtraneousValues: true,
		});
	}

	private async validateAccess(
		user: AccessJwtPayload,
		result: StudentResultEntity,
	) {
		const isCurrentUser =
			user.role === UserRole.STUDENT && result.student.id === user.sub;
		const isTeacherOfResult =
			user.role === UserRole.TEACHER &&
			result.exam.class.teacher.id === user.sub;
		if (!(isCurrentUser || isTeacherOfResult)) {
			throw new AccessForbiddenException();
		}
	}
}
