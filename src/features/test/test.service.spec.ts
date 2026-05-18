import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ChoiceEntity } from "../../database/entities/choice.entity";
import { ClassEntity } from "../../database/entities/class.entity";
import { QuestionEntity } from "../../database/entities/question.entity";
import { StudentClassEntity } from "../../database/entities/student-class.entity";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { BaseException } from "../../shared/exception/base.exception";
import { RedisService } from "../../shared/redis/redis.service";
import { StudentResultService } from "../../shared/services/student-result.service";
import { UserRole } from "../../shared/types/user-role.enum";
import { AnalysisService } from "../analysis/analysis.service";
import { TestService } from "./test.service";
import { FraudType } from "./type";
import * as batchLoadModule from "./utils/batch-load.util";
import * as calculateTestTimeSpentModule from "./utils/calculate-test-time-spent";

describe("TestService", () => {
	let service: TestService;

	const VALID_UUID = "16ed43ed-f6af-4272-a481-cc01b4e4cd6b";
	const VALID_UUID_2 = "26ed43ed-f6af-4272-a481-cc01b4e4cd6b";
	const STUDENT_ID = "student-id-1";
	const TEACHER_ID = "teacher-id-1";
	const CLASS_ID = "class-456";

	const mockTest = {
		id: VALID_UUID,
		testName: "Final Exam",
		startedTime: new Date(Date.now() - 1000 * 60 * 5),
		duration: 60,
		totalQuestions: 10,
		antiCheating: false,
		createdAt: new Date(),
		class: { id: CLASS_ID },
		topic: { topicName: "Math" },
	} as TestEntity;

	const mockTestRepository = {
		findOne: jest.fn(),
		findAndCount: jest.fn(),
		exists: jest.fn(),
	};

	const mockQuestionRepository = {
		find: jest.fn(),
	};

	const mockChoiceRepository = {
		find: jest.fn(),
	};

	const mockStudentResultRepository = {
		create: jest.fn(),
		save: jest.fn(),
		findAndCount: jest.fn(),
		createQueryBuilder: jest.fn(),
	};

	const mockClassRepository = {
		exists: jest.fn(),
	};

	const mockStudentClassRepository = {
		findOne: jest.fn(),
		exists: jest.fn(),
	};

	const mockStudentResultService = {
		getStudentAttemptedTests: jest.fn(),
	};

	const mockRedisService = {
		getCache: jest.fn(),
		setCache: jest.fn(),
		delCache: jest.fn(),
	};

	const mockAnalysisService = {
		triggerRefreshGpaView: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TestService,
				{
					provide: getRepositoryToken(TestEntity),
					useValue: mockTestRepository,
				},
				{
					provide: getRepositoryToken(QuestionEntity),
					useValue: mockQuestionRepository,
				},
				{
					provide: getRepositoryToken(ChoiceEntity),
					useValue: mockChoiceRepository,
				},
				{
					provide: getRepositoryToken(StudentResultEntity),
					useValue: mockStudentResultRepository,
				},
				{
					provide: getRepositoryToken(ClassEntity),
					useValue: mockClassRepository,
				},
				{
					provide: getRepositoryToken(StudentClassEntity),
					useValue: mockStudentClassRepository,
				},
				{ provide: StudentResultService, useValue: mockStudentResultService },
				{ provide: RedisService, useValue: mockRedisService },
				{ provide: AnalysisService, useValue: mockAnalysisService },
			],
		}).compile();

		service = module.get<TestService>(TestService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	// ─── validateTestAccess ───────────────────────────────────────────────────────

	describe("validateTestAccess", () => {
		it("TC001: Should throw 403 TEST_ACCESS_DENIED when checkAccess returns false", async () => {
			jest.spyOn(service as any, "checkAccess").mockResolvedValue(false);

			await expect(
				service.validateTestAccess(mockTest, STUDENT_ID, UserRole.STUDENT),
			).rejects.toThrow(new BaseException(403, "TEST_ACCESS_DENIED"));

			expect((service as any).checkAccess).toHaveBeenCalledWith(
				CLASS_ID,
				STUDENT_ID,
				UserRole.STUDENT,
			);
		});

		it("TC002: Should NOT call validateTestTiming when role is TEACHER and has access", async () => {
			jest.spyOn(service as any, "checkAccess").mockResolvedValue(true);
			const timingSpy = jest
				.spyOn(service as any, "validateTestTiming")
				.mockResolvedValue(undefined);

			await service.validateTestAccess(mockTest, TEACHER_ID, UserRole.TEACHER);

			expect(timingSpy).not.toHaveBeenCalled();
		});

		it("TC003: Should call validateTestTiming when role is STUDENT and has access", async () => {
			jest.spyOn(service as any, "checkAccess").mockResolvedValue(true);
			const timingSpy = jest
				.spyOn(service as any, "validateTestTiming")
				.mockResolvedValue(undefined);

			await service.validateTestAccess(mockTest, STUDENT_ID, UserRole.STUDENT);

			expect(timingSpy).toHaveBeenCalledWith(mockTest, expect.any(Date));
		});
	});

	// ─── getTestInfo ─────────────────────────────────────────────────────────────

	describe("getTestInfo", () => {
		it("TC004: Should throw 404 TEST_NOT_FOUND when testId format is invalid", async () => {
			await expect(
				service.getTestInfo("invalid-id", STUDENT_ID, UserRole.STUDENT),
			).rejects.toThrow(new BaseException(404, "TEST_NOT_FOUND"));
		});

		it("TC005: Should throw 404 TEST_NOT_FOUND when test does not exist in DB", async () => {
			mockTestRepository.findOne.mockResolvedValue(null);

			await expect(
				service.getTestInfo(VALID_UUID, STUDENT_ID, UserRole.STUDENT),
			).rejects.toThrow(new BaseException(404, "TEST_NOT_FOUND"));

			expect(mockTestRepository.findOne).toHaveBeenCalledWith({
				where: { id: VALID_UUID },
				relations: { class: true },
			});
		});

		it("TC006: Should return test when exists and user has access", async () => {
			mockTestRepository.findOne.mockResolvedValue(mockTest);
			jest.spyOn(service as any, "checkAccess").mockResolvedValue(true);
			jest
				.spyOn(service as any, "validateTestTiming")
				.mockResolvedValue(undefined);

			const result = await service.getTestInfo(
				VALID_UUID,
				STUDENT_ID,
				UserRole.STUDENT,
			);

			expect(result).toEqual(mockTest);
			expect((service as any).checkAccess).toHaveBeenCalledWith(
				CLASS_ID,
				STUDENT_ID,
				UserRole.STUDENT,
			);
		});

		it("TC007: Should throw 403 TEST_ACCESS_DENIED when test exists but user has no access", async () => {
			mockTestRepository.findOne.mockResolvedValue(mockTest);
			jest.spyOn(service as any, "checkAccess").mockResolvedValue(false);

			await expect(
				service.getTestInfo(VALID_UUID, STUDENT_ID, UserRole.STUDENT),
			).rejects.toThrow(new BaseException(403, "TEST_ACCESS_DENIED"));
		});
	});

	// ─── getDetailedTestInfo ──────────────────────────────────────────────────────

	describe("getDetailedTestInfo", () => {
		it("TC008: Should throw 404 TEST_NOT_FOUND when test does not exist", async () => {
			mockTestRepository.findOne.mockResolvedValue(null);

			await expect(
				service.getDetailedTestInfo({
					testId: VALID_UUID,
					studentId: STUDENT_ID,
				}),
			).rejects.toThrow(new BaseException(404, "TEST_NOT_FOUND"));

			expect(mockTestRepository.findOne).toHaveBeenCalledWith({
				where: { id: VALID_UUID },
				relations: ["topic", "class"],
			});
		});

		it("TC009: Should throw 403 CLASS_ACCESS_DENIED when student is not enrolled", async () => {
			mockTestRepository.findOne.mockResolvedValue(mockTest);
			mockStudentClassRepository.findOne.mockResolvedValue(null);

			await expect(
				service.getDetailedTestInfo({
					testId: VALID_UUID,
					studentId: STUDENT_ID,
				}),
			).rejects.toThrow(new BaseException(403, "CLASS_ACCESS_DENIED"));

			expect(mockStudentClassRepository.findOne).toHaveBeenCalledWith({
				where: { student: { id: STUDENT_ID }, class: { id: CLASS_ID } },
			});
		});

		it("TC010: Should return detailed info with hasAttempted=true when student attempted the test", async () => {
			mockTestRepository.findOne.mockResolvedValue(mockTest);
			mockStudentClassRepository.findOne.mockResolvedValue({ id: "enroll-1" });
			mockStudentResultService.getStudentAttemptedTests.mockResolvedValue(
				new Set([VALID_UUID]),
			);

			const result = await service.getDetailedTestInfo({
				testId: VALID_UUID,
				studentId: STUDENT_ID,
			});

			expect(result).toEqual({
				id: mockTest.id,
				testName: mockTest.testName,
				startedTime: mockTest.startedTime,
				duration: mockTest.duration,
				totalQuestions: mockTest.totalQuestions,
				antiCheating: mockTest.antiCheating,
				topic: "Math",
				createdAt: mockTest.createdAt,
				hasAttempted: true,
			});
		});

		it("TC011: Should return hasAttempted=false when student has NOT attempted the test", async () => {
			mockTestRepository.findOne.mockResolvedValue(mockTest);
			mockStudentClassRepository.findOne.mockResolvedValue({ id: "enroll-1" });
			mockStudentResultService.getStudentAttemptedTests.mockResolvedValue(
				new Set([]),
			);

			const result = await service.getDetailedTestInfo({
				testId: VALID_UUID,
				studentId: STUDENT_ID,
			});

			expect(result.hasAttempted).toBe(false);
		});
	});

	// ─── submitTest ───────────────────────────────────────────────────────────────

	describe("submitTest", () => {
		const dto = {
			testId: VALID_UUID,
			answers: [
				{ questionId: "q1", optionId: "o1" },
				{ questionId: "q2", answer: "paris" },
			],
		};

		const mockQuestion1: { id: string; answer: string | null } = {
			id: "q1",
			answer: null,
		};
		const mockQuestion2: { id: string; answer: string | null } = {
			id: "q2",
			answer: "paris",
		};
		const mockCorrectChoice = { id: "o1", isCorrect: true };
		const mockSavedResult = { id: "result-1" };

		const setupSubmitMocks = (
			questionsMap: Map<string, any>,
			choicesMap: Map<string, any>,
			fraudData: any = null,
		) => {
			mockTestRepository.findOne.mockResolvedValue({
				...mockTest,
				totalQuestions: 2,
				topic: { topicName: "Math" },
			});
			const batchLoadSpy = jest.spyOn(batchLoadModule, "batchLoad");
			batchLoadSpy
				.mockResolvedValueOnce(questionsMap)
				.mockResolvedValueOnce(choicesMap);
			mockRedisService.getCache.mockResolvedValue(fraudData);
			jest
				.spyOn(calculateTestTimeSpentModule, "calculateTestTimeSpent")
				.mockResolvedValue(5);
			mockStudentResultRepository.create.mockReturnValue(mockSavedResult);
			mockStudentResultRepository.save.mockResolvedValue(mockSavedResult);
			mockAnalysisService.triggerRefreshGpaView.mockResolvedValue(undefined);
			mockRedisService.delCache.mockResolvedValue(undefined);
		};

		it("TC012: Should throw 404 TEST_NOT_FOUND when test does not exist", async () => {
			mockTestRepository.findOne.mockResolvedValue(null);

			await expect(
				service.submitTest({ dto, studentId: STUDENT_ID }),
			).rejects.toThrow(new BaseException(404, "TEST_NOT_FOUND"));
		});

		it("TC013: Should throw 400 INVALID_QUESTION when questionId not found", async () => {
			mockTestRepository.findOne.mockResolvedValue({
				...mockTest,
				totalQuestions: 1,
			});
			jest
				.spyOn(batchLoadModule, "batchLoad")
				.mockResolvedValueOnce(new Map())
				.mockResolvedValueOnce(new Map());

			await expect(
				service.submitTest({
					dto: { testId: VALID_UUID, answers: [{ questionId: "invalid-q" }] },
					studentId: STUDENT_ID,
				}),
			).rejects.toThrow(new BaseException(400, "INVALID_QUESTION"));
		});

		it("TC014: Should throw 400 INVALID_CHOICE when optionId not found in choices", async () => {
			mockTestRepository.findOne.mockResolvedValue({
				...mockTest,
				totalQuestions: 1,
			});
			jest
				.spyOn(batchLoadModule, "batchLoad")
				.mockResolvedValueOnce(new Map([["q1", mockQuestion1]]))
				.mockResolvedValueOnce(new Map());

			await expect(
				service.submitTest({
					dto: {
						testId: VALID_UUID,
						answers: [{ questionId: "q1", optionId: "invalid-o" }],
					},
					studentId: STUDENT_ID,
				}),
			).rejects.toThrow(new BaseException(400, "INVALID_CHOICE"));
		});

		it("TC015: Should correctly count correct answers via optionId and text answer", async () => {
			setupSubmitMocks(
				new Map([
					["q1", mockQuestion1],
					["q2", mockQuestion2],
				]),
				new Map([["o1", mockCorrectChoice]]),
			);

			const result = await service.submitTest({ dto, studentId: STUDENT_ID });

			expect(result.correctQuestions).toBe(2);
			expect(result.score).toBe(10);
			expect(result.correctRate).toBe(100);
		});

		it("TC016: Should count text answer as correct when it matches case-insensitively", async () => {
			const dtoWithTextAnswer = {
				testId: VALID_UUID,
				answers: [{ questionId: "q2", answer: "  PARIS  " }],
			};
			mockTestRepository.findOne.mockResolvedValue({
				...mockTest,
				totalQuestions: 1,
				topic: { topicName: "Math" },
			});
			jest
				.spyOn(batchLoadModule, "batchLoad")
				.mockResolvedValueOnce(new Map([["q2", mockQuestion2]]))
				.mockResolvedValueOnce(new Map());
			mockRedisService.getCache.mockResolvedValue(null);
			jest
				.spyOn(calculateTestTimeSpentModule, "calculateTestTimeSpent")
				.mockResolvedValue(5);
			mockStudentResultRepository.create.mockReturnValue({ id: "r-1" });
			mockStudentResultRepository.save.mockResolvedValue({ id: "r-1" });
			mockAnalysisService.triggerRefreshGpaView.mockResolvedValue(undefined);

			const result = await service.submitTest({
				dto: dtoWithTextAnswer,
				studentId: STUDENT_ID,
			});

			expect(result.correctQuestions).toBe(1);
		});

		it("TC017: Should return fraud data from redis if it exists", async () => {
			const fraudData = {
				frauds: [{ type: FraudType.FULLSCREEN_EXIT, times: 2 }],
			};
			setupSubmitMocks(
				new Map([
					["q1", mockQuestion1],
					["q2", mockQuestion2],
				]),
				new Map([["o1", mockCorrectChoice]]),
				fraudData,
			);
			mockRedisService.getCache.mockImplementation((key: string) => {
				if (key.startsWith("fraud:")) return Promise.resolve(fraudData);
				return Promise.resolve(null);
			});

			const result = await service.submitTest({ dto, studentId: STUDENT_ID });

			expect(result.fraud).toEqual(fraudData.frauds);
		});

		it("TC018: Should save result and trigger analysis refresh", async () => {
			setupSubmitMocks(
				new Map([
					["q1", mockQuestion1],
					["q2", mockQuestion2],
				]),
				new Map([["o1", mockCorrectChoice]]),
			);

			await service.submitTest({ dto, studentId: STUDENT_ID });

			expect(mockStudentResultRepository.save).toHaveBeenCalled();
			expect(mockAnalysisService.triggerRefreshGpaView).toHaveBeenCalled();
			expect(mockRedisService.delCache).toHaveBeenCalledWith(
				`fraud:${VALID_UUID}:${STUDENT_ID}`,
			);
		});
	});

	// ─── getSummary ───────────────────────────────────────────────────────────────

	describe("getSummary", () => {
		const mockQbResult = {
			totalStudents: "5",
			averageScore: "7.56",
			highestScore: "10",
			lowestScore: "4",
		};

		beforeEach(() => {
			jest
				.spyOn(service as any, "assertCanAccessTest")
				.mockResolvedValue(undefined);
			const qb = {
				where: jest.fn().mockReturnThis(),
				select: jest.fn().mockReturnThis(),
				addSelect: jest.fn().mockReturnThis(),
				getRawOne: jest.fn().mockResolvedValue(mockQbResult),
			};
			mockStudentResultRepository.createQueryBuilder.mockReturnValue(qb);
		});

		it("TC019: Should throw if user has no access (via assertCanAccessTest)", async () => {
			(service as any).assertCanAccessTest = jest
				.fn()
				.mockRejectedValue(new BaseException(403, "TEST_ACCESS_DENIED"));

			await expect(
				service.getSummary(VALID_UUID, STUDENT_ID, UserRole.STUDENT),
			).rejects.toThrow(new BaseException(403, "TEST_ACCESS_DENIED"));
		});

		it("TC020: Should return correct aggregated summary", async () => {
			const result = await service.getSummary(
				VALID_UUID,
				TEACHER_ID,
				UserRole.TEACHER,
			);

			expect(result).toEqual({
				totalStudents: 5,
				averageScore: 7.6,
				highestScore: 10,
				lowestScore: 4,
			});
		});

		it("TC021: Should return zeros when no results exist", async () => {
			const qb = {
				where: jest.fn().mockReturnThis(),
				select: jest.fn().mockReturnThis(),
				addSelect: jest.fn().mockReturnThis(),
				getRawOne: jest.fn().mockResolvedValue({
					totalStudents: null,
					averageScore: null,
					highestScore: null,
					lowestScore: null,
				}),
			};
			mockStudentResultRepository.createQueryBuilder.mockReturnValue(qb);

			const result = await service.getSummary(
				VALID_UUID,
				TEACHER_ID,
				UserRole.TEACHER,
			);

			expect(result).toEqual({
				totalStudents: 0,
				averageScore: 0,
				highestScore: 0,
				lowestScore: 0,
			});
		});
	});

	// ─── getStudentTestListResult ─────────────────────────────────────────────────

	describe("getStudentTestListResult", () => {
		const submittedAt = new Date("2025-01-15T10:00:00Z");
		const mockResults = [
			{
				id: "result-1",
				student: { fullName: "Nguyen Van A" },
				fraud: [{ type: FraudType.FULLSCREEN_EXIT, times: 1 }],
				score: 8,
				correctRate: 80,
				timespent: 30,
				createdAt: submittedAt,
			},
		];

		beforeEach(() => {
			jest
				.spyOn(service as any, "assertCanAccessTest")
				.mockResolvedValue(undefined);
			mockStudentResultRepository.findAndCount.mockResolvedValue([
				mockResults,
				1,
			]);
		});

		it("TC022: Should return paginated student result list", async () => {
			const result = await service.getStudentTestListResult(
				VALID_UUID,
				TEACHER_ID,
				UserRole.TEACHER,
				1,
				10,
			);

			expect(result.data).toHaveLength(1);
			expect(result.data[0]).toEqual({
				id: "result-1",
				studentName: "Nguyen Van A",
				violations: 1,
				score: 8,
				totalScore: 10,
				percentage: 80,
				durationMinutes: 30,
				submittedAt: "2025-01-15",
			});
			expect(result.metadata).toEqual({ page: 1, limit: 10, totalPages: 1 });
		});

		it("TC023: Should calculate totalPages correctly", async () => {
			mockStudentResultRepository.findAndCount.mockResolvedValue([
				mockResults,
				25,
			]);

			const result = await service.getStudentTestListResult(
				VALID_UUID,
				TEACHER_ID,
				UserRole.TEACHER,
				1,
				10,
			);

			expect(result.metadata.totalPages).toBe(3);
		});

		it("TC024: Should use default studentName Unknown when student is null", async () => {
			mockStudentResultRepository.findAndCount.mockResolvedValue([
				[{ ...mockResults[0], student: null }],
				1,
			]);

			const result = await service.getStudentTestListResult(
				VALID_UUID,
				TEACHER_ID,
				UserRole.TEACHER,
			);

			expect(result.data[0].studentName).toBe("Unknown");
		});

		it("TC025: Should query with correct skip/take for page 2", async () => {
			mockStudentResultRepository.findAndCount.mockResolvedValue([[], 0]);

			await service.getStudentTestListResult(
				VALID_UUID,
				TEACHER_ID,
				UserRole.TEACHER,
				2,
				5,
			);

			expect(mockStudentResultRepository.findAndCount).toHaveBeenCalledWith(
				expect.objectContaining({ skip: 5, take: 5 }),
			);
		});
	});

	// ─── storeTestFraudResult ─────────────────────────────────────────────────────

	describe("storeTestFraudResult", () => {
		beforeEach(() => {
			mockTestRepository.findOne.mockResolvedValue(mockTest);
			jest.spyOn(service, "validateTestAccess").mockResolvedValue(undefined);
		});

		it("TC026: Should throw 404 when test not found", async () => {
			mockTestRepository.findOne.mockResolvedValue(null);

			await expect(
				service.storeTestFraudResult(
					VALID_UUID,
					STUDENT_ID,
					UserRole.STUDENT,
					FraudType.FULLSCREEN_EXIT,
				),
			).rejects.toThrow(new BaseException(404, "TEST_NOT_FOUND"));
		});

		it("TC027: Should create new fraud cache when no existing cache", async () => {
			mockRedisService.getCache.mockResolvedValue(null);

			await service.storeTestFraudResult(
				VALID_UUID,
				STUDENT_ID,
				UserRole.STUDENT,
				FraudType.FULLSCREEN_EXIT,
			);

			expect(mockRedisService.setCache).toHaveBeenCalledWith(
				`fraud:${VALID_UUID}:${STUDENT_ID}`,
				{ frauds: [{ type: FraudType.FULLSCREEN_EXIT, times: 1 }] },
			);
		});

		it("TC028: Should increment existing fraud type count", async () => {
			mockRedisService.getCache.mockResolvedValue({
				frauds: [{ type: FraudType.FULLSCREEN_EXIT, times: 2 }],
			});

			await service.storeTestFraudResult(
				VALID_UUID,
				STUDENT_ID,
				UserRole.STUDENT,
				FraudType.FULLSCREEN_EXIT,
			);

			expect(mockRedisService.setCache).toHaveBeenCalledWith(
				`fraud:${VALID_UUID}:${STUDENT_ID}`,
				{ frauds: [{ type: FraudType.FULLSCREEN_EXIT, times: 3 }] },
			);
		});

		it("TC029: Should append new fraud type when existing cache has different type", async () => {
			mockRedisService.getCache.mockResolvedValue({
				frauds: [{ type: FraudType.VISIBILITY_CHANGE, times: 1 }],
			});

			await service.storeTestFraudResult(
				VALID_UUID,
				STUDENT_ID,
				UserRole.STUDENT,
				FraudType.FULLSCREEN_EXIT,
			);

			expect(mockRedisService.setCache).toHaveBeenCalledWith(
				`fraud:${VALID_UUID}:${STUDENT_ID}`,
				{
					frauds: [
						{ type: FraudType.VISIBILITY_CHANGE, times: 1 },
						{ type: FraudType.FULLSCREEN_EXIT, times: 1 },
					],
				},
			);
		});

		it("TC030: Should return null on success", async () => {
			mockRedisService.getCache.mockResolvedValue(null);

			const result = await service.storeTestFraudResult(
				VALID_UUID,
				STUDENT_ID,
				UserRole.STUDENT,
				FraudType.FULLSCREEN_EXIT,
			);

			expect(result).toBeNull();
		});
	});

	// ─── saveTestStartTimeOfStudent ───────────────────────────────────────────────

	describe("saveTestStartTimeOfStudent", () => {
		const startTime = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
		const testStartTimeKey = `test_start_time:${VALID_UUID}:${STUDENT_ID}`;

		it("TC031: Should save start time to cache if not already set", async () => {
			mockRedisService.getCache.mockResolvedValue(null);

			await service.saveTestStartTimeOfStudent({
				studentId: STUDENT_ID,
				testId: VALID_UUID,
				startTime,
			});

			expect(mockRedisService.setCache).toHaveBeenCalledWith(
				testStartTimeKey,
				expect.any(Number),
				expect.any(Number),
			);
		});

		it("TC032: Should NOT overwrite cache if start time already exists", async () => {
			mockRedisService.getCache.mockResolvedValue(Date.now() - 60000);

			await service.saveTestStartTimeOfStudent({
				studentId: STUDENT_ID,
				testId: VALID_UUID,
				startTime,
			});

			expect(mockRedisService.setCache).not.toHaveBeenCalled();
		});

		it("TC033: Should use 24-hour TTL when startTime is not provided", async () => {
			mockRedisService.getCache.mockResolvedValue(null);

			await service.saveTestStartTimeOfStudent({
				studentId: STUDENT_ID,
				testId: VALID_UUID,
				startTime: undefined as any,
			});

			expect(mockRedisService.setCache).toHaveBeenCalledWith(
				testStartTimeKey,
				expect.any(Number),
				3600 * 24,
			);
		});
	});

	// ─── private: checkAccess ─────────────────────────────────────────────────────

	describe("checkAccess (private)", () => {
		it("TC034: Should return true for TEACHER who owns the class", async () => {
			mockClassRepository.exists.mockResolvedValue(true);

			const result = await (service as any).checkAccess(
				CLASS_ID,
				TEACHER_ID,
				UserRole.TEACHER,
			);

			expect(result).toBe(true);
			expect(mockClassRepository.exists).toHaveBeenCalledWith({
				where: { id: CLASS_ID, teacher: { id: TEACHER_ID } },
			});
		});

		it("TC035: Should return false for TEACHER who does NOT own the class", async () => {
			mockClassRepository.exists.mockResolvedValue(false);

			const result = await (service as any).checkAccess(
				CLASS_ID,
				"other-teacher",
				UserRole.TEACHER,
			);

			expect(result).toBe(false);
		});

		it("TC036: Should return true for STUDENT enrolled in the class", async () => {
			mockStudentClassRepository.exists.mockResolvedValue(true);

			const result = await (service as any).checkAccess(
				CLASS_ID,
				STUDENT_ID,
				UserRole.STUDENT,
			);

			expect(result).toBe(true);
			expect(mockStudentClassRepository.exists).toHaveBeenCalledWith({
				where: { class: { id: CLASS_ID }, student: { id: STUDENT_ID } },
			});
		});

		it("TC037: Should return false for STUDENT not enrolled in the class", async () => {
			mockStudentClassRepository.exists.mockResolvedValue(false);

			const result = await (service as any).checkAccess(
				CLASS_ID,
				STUDENT_ID,
				UserRole.STUDENT,
			);

			expect(result).toBe(false);
		});

		it("TC038: Should return false for unknown role", async () => {
			const result = await (service as any).checkAccess(
				CLASS_ID,
				"user-1",
				"ADMIN" as UserRole,
			);

			expect(result).toBe(false);
		});
	});

	// ─── private: assertCanAccessTest ────────────────────────────────────────────

	describe("assertCanAccessTest (private)", () => {
		it("TC042: Should throw 404 TEST_NOT_FOUND when test does not exist", async () => {
			mockTestRepository.findOne.mockResolvedValue(null);

			await expect(
				(service as any).assertCanAccessTest(
					VALID_UUID,
					TEACHER_ID,
					UserRole.TEACHER,
				),
			).rejects.toThrow(new BaseException(404, "TEST_NOT_FOUND"));

			expect(mockTestRepository.findOne).toHaveBeenCalledWith({
				where: { id: VALID_UUID },
				relations: { class: true },
				select: { id: true, class: { id: true } },
			});
		});

		it("TC043: Should throw 403 TEST_ACCESS_DENIED when test exists but user has no access", async () => {
			mockTestRepository.findOne.mockResolvedValue(mockTest);
			jest.spyOn(service as any, "checkAccess").mockResolvedValue(false);

			await expect(
				(service as any).assertCanAccessTest(
					VALID_UUID,
					TEACHER_ID,
					UserRole.TEACHER,
				),
			).rejects.toThrow(new BaseException(403, "TEST_ACCESS_DENIED"));

			expect((service as any).checkAccess).toHaveBeenCalledWith(
				CLASS_ID,
				TEACHER_ID,
				UserRole.TEACHER,
			);
		});

		it("TC044: Should resolve without throwing when test exists and user has access", async () => {
			mockTestRepository.findOne.mockResolvedValue(mockTest);
			jest.spyOn(service as any, "checkAccess").mockResolvedValue(true);

			await expect(
				(service as any).assertCanAccessTest(
					VALID_UUID,
					TEACHER_ID,
					UserRole.TEACHER,
				),
			).resolves.toBeUndefined();
		});
	});

	// ─── private: validateTestTiming ─────────────────────────────────────────────

	describe("validateTestTiming (private)", () => {
		it("TC039: Should throw 403 TEST_NOT_STARTED when test has not started yet", async () => {
			const futureTest = {
				startedTime: new Date(Date.now() + 60000),
				duration: 60,
			} as TestEntity;

			await expect(
				(service as any).validateTestTiming(futureTest, new Date()),
			).rejects.toThrow(new BaseException(403, "TEST_NOT_STARTED"));
		});

		it("TC040: Should throw 403 TEST_ENDED when test time is up", async () => {
			const endedTest = {
				startedTime: new Date(Date.now() - 1000 * 60 * 90), // 90 min ago
				duration: 60,
			} as TestEntity;

			await expect(
				(service as any).validateTestTiming(endedTest, new Date()),
			).rejects.toThrow(new BaseException(403, "TEST_ENDED"));
		});

		it("TC041: Should NOT throw when test is currently ongoing", async () => {
			const activeTest = {
				startedTime: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
				duration: 60,
			} as TestEntity;

			await expect(
				(service as any).validateTestTiming(activeTest, new Date()),
			).resolves.not.toThrow();
		});
	});
});
