import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ChoiceEntity } from "../../database/entities/choice.entity";
import { ClassEntity } from "../../database/entities/class.entity";
import { QuestionEntity } from "../../database/entities/question.entity";
import { StudentClassEntity } from "../../database/entities/student-class.entity";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { TestEntity } from "../../database/entities/test.entity";

import { BaseException } from "../../shared/exception/base.exception";
import { UserRole } from "../../shared/types/user-role.enum";

import { SubmitTestRequestDto } from "./dtos/submit-test.req.dto";
import { batchLoad } from "./utils/batch-load.util";
import calculateCorrectRate from "./utils/calculate-correct-rate.util";
import calculateScore from "./utils/calculate-score.util";

@Injectable()
export class TestService {
	constructor(
		@InjectRepository(TestEntity)
		private readonly testRepository: Repository<TestEntity>,

		@InjectRepository(QuestionEntity)
		private readonly questionRepository: Repository<QuestionEntity>,

		@InjectRepository(ChoiceEntity)
		private readonly choiceRepository: Repository<ChoiceEntity>,

		@InjectRepository(StudentResultEntity)
		private readonly studentResultRepository: Repository<StudentResultEntity>,

		@InjectRepository(ClassEntity)
		private readonly classRepository: Repository<ClassEntity>,

		@InjectRepository(StudentClassEntity)
		private readonly studentClassRepository: Repository<StudentClassEntity>,
	) {}

	async validateTestAccess(
		testId: string,
		userId: string,
		role: UserRole,
	): Promise<TestEntity> {
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

		return test;
	}

	async getExam(testId: string, userId: string, role: UserRole) {
		const test = await this.validateTestAccess(testId, userId, role);

		return test;
	}

	async submitTest({
		dto,
		studentId,
	}: {
		dto: SubmitTestRequestDto;
		studentId: string;
	}) {
		const { testId, answers } = dto;

		const test = await this.testRepository.findOne({ where: { id: testId } });
		const totalQuestions = test?.totalQuestions ?? answers.length;

		const questionIds = answers.map((a) => a.questionId);
		const questionsMap = await batchLoad(this.questionRepository, questionIds);

		const optionIds = answers.filter((a) => a.optionId).map((a) => a.optionId!);
		const choicesMap = await batchLoad(this.choiceRepository, optionIds);

		let correct = 0;

		for (const answer of answers) {
			const question = questionsMap.get(answer.questionId);
			if (!question) {
				throw new BaseException(400, "INVALID_QUESTION");
			}

			if (answer.optionId) {
				const choice = choicesMap.get(answer.optionId);
				if (!choice) {
					throw new BaseException(400, "INVALID_CHOICE");
				} else if (choice.isCorrect) {
					correct++;
				}
			} else if (typeof answer.answer === "string") {
				const expected = (question.answer ?? "")
					.toString()
					.trim()
					.toLowerCase();
				const actual = answer.answer.trim().toLowerCase();
				if (expected === actual) {
					correct++;
				}
			}
		}

		const score = calculateScore(correct, totalQuestions);

		const studentResult = this.studentResultRepository.create({
			student: { id: studentId },
			exam: { id: testId },
			score,
			studentAnswers: answers,
		});

		const correctRate = calculateCorrectRate(correct, totalQuestions);

		await this.studentResultRepository.save(studentResult);
		return {
			score,
			correctRate: correctRate,
			subject: test?.topic.topicName ?? "Unknown",
			correctQuestions: correct,
			totalQuestions,
		};
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
