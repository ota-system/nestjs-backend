import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ChoiceEntity } from "../../database/entities/choice.entity";
import { ClassEntity } from "../../database/entities/class.entity";
import { QuestionEntity } from "../../database/entities/question.entity";
import { StudentClassEntity } from "../../database/entities/student-class.entity";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { UUID_REGEX } from "../../shared/constants/uuid.constant";
import { BaseException } from "../../shared/exception/base.exception";
import { StudentResultService } from "../../shared/services/student-result.service";
import { UserRole } from "../../shared/types/user-role.enum";
import { checkTimesUp } from "../../shared/utils/checkTimesUp.util";
import { SubmitTestRequestDto } from "./dtos/submit-test.req.dto";
import { SubmitTestAnswer } from "./type";
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

		private readonly studentResultService: StudentResultService,
	) {}

	async validateTestAccess(test: TestEntity, userId: string, role: UserRole) {
		const now = new Date();

		const hasAccess = await this.checkAccess(test.class.id, userId, role);
		if (!hasAccess) {
			throw new BaseException(403, "TEST_ACCESS_DENIED");
		}

		if (role === UserRole.STUDENT) {
			await this.validateTestTiming(test, now);
		}
	}

	async getTestInfo(testId: string, userId: string, role: UserRole) {
		if (!UUID_REGEX.test(testId)) {
			console.warn(`Invalid testId format: ${testId}`);
			throw new BaseException(404, "TEST_NOT_FOUND");
		}

		const test = await this.testRepository.findOne({
			where: { id: testId },
			relations: { class: true },
		});

		if (!test) {
			throw new BaseException(404, "TEST_NOT_FOUND");
		}
		await this.validateTestAccess(test, userId, role);

		return test;
	}

	async getDetailedTestInfo({
		testId,
		studentId,
	}: {
		testId: string;
		studentId: string;
	}) {
		const test = await this.testRepository.findOne({
			where: { id: testId },
			relations: ["topic", "class"],
		});

		if (!test) {
			throw new BaseException(404, "TEST_NOT_FOUND");
		}

		const enrollment = await this.studentClassRepository.findOne({
			where: {
				student: { id: studentId },
				class: { id: test.class.id },
			},
		});

		if (!enrollment) {
			throw new BaseException(403, "CLASS_ACCESS_DENIED");
		}

		const testIds = [test.id];

		const attemptedTestIds =
			await this.studentResultService.getStudentAttemptedTests(
				studentId,
				testIds,
			);

		return {
			id: test.id,
			testName: test.testName,
			startedTime: test.startedTime,
			duration: test.duration,
			totalQuestions: test.totalQuestions,
			antiCheating: test.antiCheating,
			topic: test.topic.topicName,
			createdAt: test.createdAt,
			hasAttempted: attemptedTestIds.has(test.id),
		};
	}

	async submitTest({
		dto,
		studentId,
	}: {
		dto: SubmitTestRequestDto;
		studentId: string;
	}) {
		const { testId, answers } = dto;

		const test = await this.testRepository.findOne({
			where: { id: testId },
			relations: { topic: true },
		});
		const totalQuestions = test?.totalQuestions ?? answers.length;

		const questionIds = answers.map((a) => a.questionId);
		const questionsMap = await batchLoad(this.questionRepository, questionIds);

		const optionIds = answers.filter((a) => a.optionId).map((a) => a.optionId!);
		const choicesMap = await batchLoad(this.choiceRepository, optionIds);

		let correct = 0;
		const studentAnswers: SubmitTestAnswer[] = answers.map((answer) => ({
			...answer,
			isCorrect: false,
		}));

		for (const answer of studentAnswers) {
			const question = questionsMap.get(answer.questionId);
			if (!question) {
				throw new BaseException(400, "INVALID_QUESTION");
			}

			if (answer.optionId) {
				const choice = choicesMap.get(answer.optionId);
				if (!choice) {
					throw new BaseException(400, "INVALID_CHOICE");
				} else if (choice.isCorrect) {
					answer.isCorrect = true;
					correct++;
				}
			} else if (typeof answer.answer === "string") {
				const expected = (question.answer ?? "")
					.toString()
					.trim()
					.toLowerCase();
				const actual = answer.answer.trim().toLowerCase();
				if (expected === actual) {
					answer.isCorrect = true;
					correct++;
				}
			}
		}

		const score = calculateScore(correct, totalQuestions);

		const correctRate = calculateCorrectRate(correct, totalQuestions);

		const studentResult = this.studentResultRepository.create({
			student: { id: studentId },
			exam: { id: testId },
			score,
			studentAnswers,
			correctRate: correctRate,
		});

		await this.studentResultRepository.save(studentResult);
		return {
			score,
			correctRate: correctRate,
			subject: test?.topic?.topicName ?? "Unknown",
			correctQuestions: correct,
			totalQuestions,
		};
	}

	async getSummary(testId: string) {
		const result = await this.studentResultRepository
			.createQueryBuilder("result")
			.where("result.exam_id = :testId", { testId })
			.select("COUNT(result.id)", "totalStudents")
			.addSelect("AVG(result.score)", "averageScore")
			.addSelect("MAX(result.score)", "highestScore")
			.addSelect("MIN(result.score)", "lowestScore")
			.getRawOne();

		return {
			totalStudents: Number(result.totalStudents) || 0,
			averageScore: Math.round((Number(result.averageScore) || 0) * 10) / 10,
			highestScore: Number(result.highestScore) || 0,
			lowestScore: Number(result.lowestScore) || 0,
		};
	}

	async getStudentTestListResult(
		testId: string,
		page: number = 1,
		limit: number = 10,
	) {
		const [results, total] = await this.studentResultRepository.findAndCount({
			where: { exam: { id: testId } },
			relations: ["student", "exam"],
			skip: (page - 1) * limit,
			take: limit,
			order: { createdAt: "DESC" },
		});

		const data = results.map((result) => {
			let violations = 0;
			if (Array.isArray(result.mistakes)) {
				violations = result.mistakes.length;
			} else if (result.mistakes) {
				violations = Object.keys(result.mistakes as object).length;
			}

			let durationMinutes = 0;
			if (result.exam?.startedTime && result.createdAt) {
				const diffMs =
					result.createdAt.getTime() - result.exam.startedTime.getTime();
				durationMinutes = Math.max(0, Math.floor(diffMs / 60000));
			}

			const maxScore = 10;

			return {
				id: result.id, // Included for React key
				studentName: result.student?.fullName || "Unknown",
				violations,
				score: result.score,
				totalScore: maxScore,
				percentage: Math.round((result.score / maxScore) * 100),
				durationMinutes,
				submittedAt: result.createdAt.toISOString().split("T")[0],
			};
		});

		return {
			data,
			meta: {
				total,
				page: Number(page),
				limit: Number(limit),
			},
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

	private async validateTestTiming(test: TestEntity, now: Date) {
		if (now < test.startedTime) {
			throw new BaseException(403, "TEST_NOT_STARTED");
		}

		if (checkTimesUp(test.startedTime, test.duration)) {
			throw new BaseException(403, "TEST_ENDED");
		}
	}
}
