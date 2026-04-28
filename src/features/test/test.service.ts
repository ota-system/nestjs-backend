import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChoiceEntity } from "../../database/entities/choice.entity";
import { QuestionEntity } from "../../database/entities/question.entity";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { BaseException } from "../../shared/exception/base.exception";
import { SubmitTestRequestDto } from "./dtos/submit-test.req.dto";
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

		let correct = 0;

		for (const answer of answers) {
			const question = await this.questionRepository.findOne({
				where: { id: answer.questionId },
			});
			if (!question) {
				throw new BaseException(400, "INVALID_QUESTION");
			}

			if (answer.optionId) {
				const choice = await this.choiceRepository.findOne({
					where: { id: answer.optionId },
				});
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
}
