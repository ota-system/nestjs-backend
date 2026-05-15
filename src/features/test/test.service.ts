import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { z } from "zod";
import { ChoiceEntity } from "../../database/entities/choice.entity";
import { ClassEntity } from "../../database/entities/class.entity";
import { QuestionEntity } from "../../database/entities/question.entity";
import { StudentClassEntity } from "../../database/entities/student-class.entity";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { UUID_REGEX } from "../../shared/constants/uuid.constant";
import { BaseException } from "../../shared/exception/base.exception";
import { RedisService } from "../../shared/redis/redis.service";
import { StudentResultService } from "../../shared/services/student-result.service";
import { UserRole } from "../../shared/types/user-role.enum";
import { checkTimesUp } from "../../shared/utils/checkTimesUp.util";
import { AnalysisService } from "../analysis/analysis.service";
import { SubmitTestRequestDto } from "./dtos/submit-test.req.dto";
import { TestFraudListSchema } from "./schema/test-fraud.schema";
import { FraudType, SubmitTestAnswer, TestFraudCache } from "./type";
import { batchLoad } from "./utils/batch-load.util";
import calculateCorrectRate from "./utils/calculate-correct-rate.util";
import calculateScore from "./utils/calculate-score.util";
import { calculateTestTimeSpent } from "./utils/calculate-test-time-spent";

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
		private readonly redisService: RedisService,
		private readonly analysisService: AnalysisService,
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

		if (!test) {
			throw new BaseException(404, "TEST_NOT_FOUND");
		}

		const totalQuestions = test.totalQuestions;

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

		const fraudKey = `fraud:${testId}:${studentId}`;
		const fraudData = await this.redisService.getCache<{
			frauds: TestFraudCache[];
		}>(fraudKey, TestFraudListSchema);

		const timespent = await calculateTestTimeSpent(
			this.redisService,
			testId,
			studentId,
		);

		const studentResult = this.studentResultRepository.create({
			student: { id: studentId },
			exam: { id: testId },
			score,
			studentAnswers,
			correctRate: correctRate,
			timespent,
			fraud: fraudData?.frauds ?? [],
		});

		await this.studentResultRepository.save(studentResult);
		await this.analysisService.triggerRefreshGpaView();

		await this.redisService.delCache(fraudKey);
		return {
			resultId: studentResult.id,
			score,
			correctRate: correctRate,
			subject: test.topic?.topicName ?? "Unknown",
			correctQuestions: correct,
			totalQuestions,
			fraud: fraudData?.frauds ?? [],
		};
	}

	async getSummary(testId: string, userId: string, role: UserRole) {
		await this.assertCanAccessTest(testId, userId, role);
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
		userId: string,
		role: UserRole,
		page: number = 1,
		limit: number = 10,
	) {
		await this.assertCanAccessTest(testId, userId, role);
		const [results, total] = await this.studentResultRepository.findAndCount({
			where: { exam: { id: testId } },
			relations: ["student", "exam"],
			skip: (page - 1) * limit,
			take: limit,
			order: { createdAt: "DESC" },
		});

		const data = results.map((result) => {
			const maxScore = 10;

			return {
				id: result.id, // Included for React key
				studentName: result.student?.fullName || "Unknown",
				violations: result.fraud?.length || 0,
				score: result.score,
				totalScore: maxScore,
				percentage: result.correctRate,
				durationMinutes: result.timespent,
				submittedAt: result.createdAt.toISOString().split("T")[0],
			};
		});

		return {
			data,
			metadata: {
				page: Number(page),
				limit: Number(limit),
				totalPages: Math.ceil(total / limit),
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
	private async assertCanAccessTest(
		testId: string,
		userId: string,
		role: UserRole,
	): Promise<void> {
		const test = await this.testRepository.findOne({
			where: { id: testId },
			relations: { class: true },
			select: {
				id: true,
				class: { id: true },
			},
		});
		if (!test) {
			throw new BaseException(404, "TEST_NOT_FOUND");
		}
		const hasAccess = await this.checkAccess(test.class.id, userId, role);
		if (!hasAccess) {
			throw new BaseException(403, "TEST_ACCESS_DENIED");
		}
	}

	async storeTestFraudResult(
		testId: string,
		studentId: string,
		role: UserRole,
		fraudType: FraudType,
	) {
		const test = await this.testRepository.findOne({
			where: { id: testId },
			relations: ["class"],
		});
		if (!test) {
			throw new BaseException(404, "TEST_NOT_FOUND");
		}

		await this.validateTestAccess(test, studentId, role);

		const key = `fraud:${testId}:${studentId}`;

		const fraudsExisting = await this.redisService.getCache<{
			frauds: TestFraudCache[];
		}>(key, TestFraudListSchema);

		if (fraudsExisting) {
			const fraudExisting = fraudsExisting.frauds.find(
				(f) => f.type === fraudType,
			);
			if (fraudExisting) {
				fraudExisting.times += 1;
			} else {
				fraudsExisting.frauds.push({ type: fraudType, times: 1 });
			}
			await this.redisService.setCache(key, fraudsExisting);
		} else {
			await this.redisService.setCache(key, {
				frauds: [{ type: fraudType, times: 1 }],
			});
		}
		return null;
	}

	async saveTestStartTimeOfStudent({
		studentId,
		testId,
		startTime,
	}: {
		studentId: string;
		testId: string;
		startTime: Date;
	}) {
		const testStartTimeKey = `test_start_time:${testId}:${studentId}`;
		const existingValue = await this.redisService.getCache<number>(
			testStartTimeKey,
			z.number(),
		);
		if (!existingValue) {
			await this.redisService.setCache(
				testStartTimeKey,
				Date.now(),
				startTime
					? Math.ceil((startTime.getTime() - Date.now()) / 1000)
					: 3600 * 24,
			);
		}
	}
}
