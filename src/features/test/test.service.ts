import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChoiceEntity } from "../../database/entities/choice.entity";
import { QuestionEntity } from "../../database/entities/question.entity";
import { StudentClassEntity } from "../../database/entities/student-class.entity";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { BaseException } from "../../shared/exception/base.exception";
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

		@InjectRepository(StudentClassEntity)
		private readonly studentClassRepository: Repository<StudentClassEntity>,
	) {}

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

	async getExamsByClass({
		classId,
		studentId,
	}: {
		classId: string;
		studentId: string;
	}) {
		const enrollment = await this.studentClassRepository.findOne({
			where: {
				student: { id: studentId },
				class: { id: classId },
			},
		});

		if (!enrollment) {
			throw new BaseException(403, "CLASS_ACCESS_DENIED");
		}

		const exams = await this.testRepository.find({
			where: { class: { id: classId } },
			relations: ["topic"],
			order: { createdAt: "DESC" },
		});

		return exams.map((exam) => ({
			id: exam.id,
			testName: exam.testName,
			startedTime: exam.startedTime,
			duration: exam.duration,
			totalQuestions: exam.totalQuestions,
			antiCheating: exam.antiCheating,
			topic: exam.topic.topicName,
			createdAt: exam.createdAt,
		}));
	}

	async getExamDetail({
		examId,
		studentId,
	}: {
		examId: string;
		studentId: string;
	}) {
		const exam = await this.testRepository.findOne({
			where: { id: examId },
			relations: ["topic", "class"],
		});

		if (!exam) {
			throw new BaseException(404, "EXAM_NOT_FOUND");
		}

		const enrollment = await this.studentClassRepository.findOne({
			where: {
				student: { id: studentId },
				class: { id: exam.class.id },
			},
		});

		if (!enrollment) {
			throw new BaseException(403, "CLASS_ACCESS_DENIED");
		}

		return {
			id: exam.id,
			testName: exam.testName,
			startedTime: exam.startedTime,
			duration: exam.duration,
			totalQuestions: exam.totalQuestions,
			antiCheating: exam.antiCheating,
			topic: exam.topic.topicName,
			createdAt: exam.createdAt,
		};
	}
}
