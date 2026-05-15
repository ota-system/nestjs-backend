import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QuestionEntity } from "../../database/entities/question.entity";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { UserRole } from "../../shared/types/user-role.enum";
import { StudentResultService } from "./student-result.service";

describe("StudentResultService", () => {
	let studentResultService: StudentResultService;
	let studentResultRepository: Repository<StudentResultEntity>;
	let questionRepository: Repository<QuestionEntity>;

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			providers: [
				StudentResultService,
				{
					provide: getRepositoryToken(StudentResultEntity),
					useFactory: mockRepository,
				},
				{
					provide: getRepositoryToken(QuestionEntity),
					useFactory: mockRepository,
				},
			],
		}).compile();

		studentResultService = moduleRef.get(StudentResultService);
		studentResultRepository = moduleRef.get(
			getRepositoryToken(StudentResultEntity),
		);
		questionRepository = moduleRef.get(getRepositoryToken(QuestionEntity));
	});

	describe("constructor", () => {
		it("should be defined", () => {
			expect(studentResultRepository).toBeDefined();
		});
	});

	describe("getTestResultInfo", () => {
		it("should return test result info for student", async () => {
			const mockResult = createMockStudentResult({});

			jest
				.spyOn(studentResultRepository, "findOne")
				.mockResolvedValue(mockResult as any);

			expect(
				await studentResultService.getTestResultInfo("1", {
					sub: "1",
					role: UserRole.STUDENT,
				} as any),
			).toEqual({
				testResultInfo: {
					testResultId: "1",
					testName: "test",
					teacherName: "teacher",
					completedAt: mockResult.createdAt,
					topic: "topic",
					totalQuestions: 1,
					score: 10,
					correctRate: 100,
				},
				questionResults: [
					{
						questionId: "1",
						isCorrect: true,
					},
				],
			});
			expect(studentResultRepository.findOne).toHaveBeenCalledWith({
				where: { id: "1" },
				relations: [
					"exam",
					"exam.topic",
					"exam.class",
					"exam.class.teacher",
					"exam.questions",
					"student",
				],
			});
		});

		it("should allow teacher of exam to access test result", async () => {
			const studentResult = createMockStudentResult({});

			jest
				.spyOn(studentResultRepository, "findOne")
				.mockResolvedValue(studentResult as any);

			const result = await studentResultService.getTestResultInfo("1", {
				sub: "1",
				role: UserRole.TEACHER,
			} as any);

			expect(result).toBeDefined();
		});

		it("should throw error if student result not found", async () => {
			jest.spyOn(studentResultRepository, "findOne").mockResolvedValue(null);
			await expect(
				studentResultService.getTestResultInfo("1", {
					sub: "1",
					role: UserRole.STUDENT,
				} as any),
			).rejects.toThrow("STUDENT_RESULT_NOT_FOUND");
		});

		it("should throw error if user is not authorized", async () => {
			const studentResult = createMockStudentResult({});
			jest
				.spyOn(studentResultRepository, "findOne")
				.mockResolvedValue(studentResult as any);

			await expect(
				studentResultService.getTestResultInfo("1", {
					sub: "2",
					role: UserRole.STUDENT,
				} as any),
			).rejects.toThrow("RESOURCE_ACCESS_DENIED");
			await expect(
				studentResultService.getTestResultInfo("1", {
					sub: "2",
					role: UserRole.TEACHER,
				} as any),
			).rejects.toThrow("RESOURCE_ACCESS_DENIED");
		});

		it("should return empty questionResults if exam questions undefined", async () => {
			const mockResult = createMockStudentResult({
				exam: {
					...createMockStudentResult({}).exam,
					questions: undefined,
				},
			});

			jest
				.spyOn(studentResultRepository, "findOne")
				.mockResolvedValue(mockResult as any);

			const result = await studentResultService.getTestResultInfo("1", {
				sub: "1",
				role: UserRole.STUDENT,
			} as any);

			expect(result.questionResults).toEqual([]);
		});
	});

	describe("getQuestionDetail", () => {
		it("should return multiple choice question detail for student", async () => {
			const mockResult = createMockStudentResult({});
			const mockQuestion = createMockQuestion({});

			jest
				.spyOn(studentResultRepository, "findOne")
				.mockResolvedValue(mockResult as any);
			jest
				.spyOn(questionRepository, "findOne")
				.mockResolvedValue(mockQuestion as any);

			expect(
				await studentResultService.getQuestionDetail("1", "1", {
					sub: "1",
					role: UserRole.STUDENT,
				} as any),
			).toEqual({
				id: "1",
				question: "question",
				type: "MULTIPLE_CHOICE",
				choices: [
					{
						id: "1",
						choice: "test",
						isCorrect: true,
					},
				],
				answer: null,
				explanation: "explanation",
				studentOptionId: "1",
				studentAnswer: null,
				isCorrect: true,
			});

			expect(questionRepository.findOne).toHaveBeenCalledWith({
				where: { id: "1", test: { id: "1" } },
				relations: ["choices"],
			});
		});

		it("should return fill in blank question detail for student", async () => {
			const mockResult = createMockStudentResult({});
			const mockQuestion = createMockQuestion({
				answer: "answer",
				choices: undefined,
			});

			jest
				.spyOn(studentResultRepository, "findOne")
				.mockResolvedValue(mockResult as any);
			jest
				.spyOn(questionRepository, "findOne")
				.mockResolvedValue(mockQuestion as any);

			expect(
				await studentResultService.getQuestionDetail("1", "1", {
					sub: "1",
					role: UserRole.STUDENT,
				} as any),
			).toEqual({
				id: "1",
				question: "question",
				type: "MULTIPLE_CHOICE",
				choices: [],
				answer: "answer",
				explanation: "explanation",
				studentOptionId: "1",
				studentAnswer: null,
				isCorrect: true,
			});
		});

		it("should allow teacher of exam to access question detail", async () => {
			const mockResult = createMockStudentResult({});
			const mockQuestion = createMockQuestion({});

			jest
				.spyOn(studentResultRepository, "findOne")
				.mockResolvedValue(mockResult as any);
			jest
				.spyOn(questionRepository, "findOne")
				.mockResolvedValue(mockQuestion as any);

			expect(
				await studentResultService.getQuestionDetail("1", "1", {
					sub: "1",
					role: UserRole.TEACHER,
				} as any),
			).toBeDefined();
		});

		it("should throw error if student result not found", async () => {
			jest.spyOn(studentResultRepository, "findOne").mockResolvedValue(null);
			await expect(
				studentResultService.getQuestionDetail("1", "1", {
					sub: "1",
					role: UserRole.STUDENT,
				} as any),
			).rejects.toThrow("STUDENT_RESULT_NOT_FOUND");
		});

		it("should throw error if user is not authorized", async () => {
			const studentResult = createMockStudentResult({});
			jest
				.spyOn(studentResultRepository, "findOne")
				.mockResolvedValue(studentResult as any);

			await expect(
				studentResultService.getQuestionDetail("1", "1", {
					sub: "2",
					role: UserRole.STUDENT,
				} as any),
			).rejects.toThrow("RESOURCE_ACCESS_DENIED");
			await expect(
				studentResultService.getQuestionDetail("1", "1", {
					sub: "2",
					role: UserRole.TEACHER,
				} as any),
			).rejects.toThrow("RESOURCE_ACCESS_DENIED");
		});

		it("should throw error if question not found", async () => {
			const mockResult = createMockStudentResult({});
			jest
				.spyOn(studentResultRepository, "findOne")
				.mockResolvedValue(mockResult as any);
			jest.spyOn(questionRepository, "findOne").mockResolvedValue(null);
			await expect(
				studentResultService.getQuestionDetail("1", "1", {
					sub: "1",
					role: UserRole.STUDENT,
				} as any),
			).rejects.toThrow("QUESTION_NOT_FOUND");
		});

		it("should return null if question has no student answer", async () => {
			const mockResult = createMockStudentResult({
				exam: {
					testName: "test",
					topic: { topicName: "topic" },
					class: { teacher: { fullName: "teacher", id: "1" } },
					questions: [{ id: "2" }],
					totalQuestions: 1,
				},
				studentAnswers: [],
			});

			jest
				.spyOn(studentResultRepository, "findOne")
				.mockResolvedValue(mockResult as any);

			const result = await studentResultService.getTestResultInfo("1", {
				sub: "1",
				role: UserRole.STUDENT,
			} as any);

			expect(result.questionResults).toEqual([
				{
					questionId: "2",
					isCorrect: null,
				},
			]);
		});

		it("should return empty choices if question choices undefined", async () => {
			const mockResult = createMockStudentResult({});
			const mockQuestion = createMockQuestion({
				choices: undefined,
			});

			jest
				.spyOn(studentResultRepository, "findOne")
				.mockResolvedValue(mockResult as any);

			jest
				.spyOn(questionRepository, "findOne")
				.mockResolvedValue(mockQuestion as any);

			const result = await studentResultService.getQuestionDetail("1", "1", {
				sub: "1",
				role: UserRole.STUDENT,
			} as any);

			expect(result.choices).toEqual([]);
		});

		it("should return null for explanation, studentOptionId, and isCorrect if they are null", async () => {
			const mockResult = createMockStudentResult({
				studentAnswers: [
					{
						questionId: "1",
						optionId: null,
						answer: null,
						isCorrect: null,
					},
				],
			});

			const mockQuestion = createMockQuestion({
				explanation: null,
			});

			jest
				.spyOn(studentResultRepository, "findOne")
				.mockResolvedValue(mockResult as any);

			jest
				.spyOn(questionRepository, "findOne")
				.mockResolvedValue(mockQuestion as any);

			const result = await studentResultService.getQuestionDetail("1", "1", {
				sub: "1",
				role: UserRole.STUDENT,
			} as any);

			expect(result).toEqual({
				id: "1",
				question: "question",
				type: "MULTIPLE_CHOICE",
				choices: [
					{
						id: "1",
						choice: "test",
						isCorrect: true,
					},
				],
				answer: null,
				explanation: null,
				studentOptionId: null,
				studentAnswer: null,
				isCorrect: null,
			});
		});
	});
});

const mockRepository = () => ({
	findOne: jest.fn(),
	find: jest.fn(),
});

const createMockStudentResult = (overrides: {}) => ({
	id: "1",
	exam: {
		id: "1",
		testName: "test",
		topic: { topicName: "topic" },
		class: { teacher: { fullName: "teacher", id: "1" } },
		questions: [{ id: "1" }],
		totalQuestions: 1,
	},
	student: { id: "1" },
	createdAt: new Date(),
	score: 10,
	correctRate: 100,
	studentAnswers: [
		{
			questionId: "1",
			optionId: "1",
			answer: undefined,
			isCorrect: true,
		},
	],
	...overrides,
});

const createMockQuestion = (overrides: {}) => ({
	id: "1",
	choices: [
		{
			id: "1",
			answer: "test",
			isCorrect: true,
		},
	],
	explanation: "explanation",
	answer: undefined,
	question: "question",
	type: "MULTIPLE_CHOICE",
	...overrides,
});
