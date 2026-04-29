import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClassEntity } from "../../database/entities/class.entity";
import { QuestionEntity } from "../../database/entities/question.entity";
import { StudentClassEntity } from "../../database/entities/student-class.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { BaseException } from "../../shared/exception/base.exception";
import { UserRole } from "../../shared/types/user-role.enum";

@Injectable()
export class QuestionService {
	constructor(
		@InjectRepository(TestEntity)
		private readonly testRepository: Repository<TestEntity>,

		@InjectRepository(QuestionEntity)
		private readonly questionRepository: Repository<QuestionEntity>,

		@InjectRepository(ClassEntity)
		private readonly classRepository: Repository<ClassEntity>,

		@InjectRepository(StudentClassEntity)
		private readonly studentClassRepository: Repository<StudentClassEntity>,
	) {}

	async getQuestionsForTest(testId: string, userId: string, role: UserRole) {
		const test = await this.testRepository.findOne({
			where: { id: testId },
			relations: { class: true },
		});

		if (!test) {
			throw new BaseException(404, "TEST_NOT_FOUND");
		}

		const now = new Date();

		if (now < test.startedTime) {
			throw new BaseException(403, "TEST_NOT_STARTED");
		}

		const endTime = new Date(
			test.startedTime.getTime() + test.duration * 60 * 1000,
		);
		if (now > endTime) {
			throw new BaseException(403, "TEST_ENDED");
		}

		const hasAccess = await this.checkAccess(test.class.id, userId, role);
		if (!hasAccess) {
			throw new BaseException(403, "TEST_ACCESS_DENIED");
		}

		const questions = await this.questionRepository.find({
			where: { test: { id: testId } },
			relations: { choices: true },
		});

		return questions.map((q) => ({
			id: q.id,
			question: q.question,
			type: q.type,
			level: q.level,
			choices: (q.choices ?? []).map((c) => ({
				id: c.id,
				answer: c.answer,
			})),
		}));
	}

	private async checkAccess(
		classId: string,
		userId: string,
		role: UserRole,
	): Promise<boolean> {
		if (role === UserRole.TEACHER) {
			return this.classRepository.exists({
				where: { id: classId, teacher: { id: userId } },
			});
		}

		if (role === UserRole.STUDENT) {
			return this.studentClassRepository.exists({
				where: { class: { id: classId }, student: { id: userId } },
			});
		}

		return false;
	}
}
