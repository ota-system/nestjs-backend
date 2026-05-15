import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChoiceEntity } from "../../database/entities/choice.entity";
import { QuestionEntity } from "../../database/entities/question.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { BaseException } from "../../shared/exception/base.exception";
import { RedisService } from "../../shared/redis/redis.service";
import { QuestionType } from "../../shared/types/question-type.enum";
import { UserRole } from "../../shared/types/user-role.enum";
import { UpdateQuestionReqDto } from "../test/dtos/update-question.req.dto";
import { QuestionDto, TestQuestionDto } from "./dtos/question-res.dto";
import { TestQuestionSchema } from "./schema/test-question.schema";

@Injectable()
export class QuestionService {
	constructor(
		@InjectRepository(QuestionEntity)
		private readonly questionRepository: Repository<QuestionEntity>,

		private readonly redisService: RedisService,
	) {}

	async getQuestionsForTest({
		test,
		role,
		page,
		limit,
	}: {
		test: TestEntity;
		role: string;
		page: number;
		limit: number;
	}) {
		let cacheKey: string;
		if (role === UserRole.STUDENT) {
			cacheKey = `exam_questions:${test.id}:p${page}:l${limit}`;
		} else {
			cacheKey = `exam_questions:${test.id}:role:${role}:p${page}:l${limit}`;
		}

		const cached = await this.redisService.getCache<TestQuestionDto>(
			cacheKey,
			TestQuestionSchema,
		);
		if (cached) return cached;

		const [questions, totalQuestions] =
			await this.questionRepository.findAndCount({
				where: { test: { id: test.id } },
				relations: { choices: true },
				skip: (page - 1) * limit,
				take: limit,
				order: { createdAt: "ASC" },
			});

		let data: QuestionDto[];

		if (role === UserRole.STUDENT) {
			data = questions.map((q) => ({
				id: q.id,
				question: q.question,
				type: q.type,
				level: q.level,
				choices: (q.choices ?? []).map((c) => ({
					id: c.id,
					answer: c.answer,
				})),
			}));
		} else {
			data = questions.map((q) => ({
				id: q.id,
				question: q.question,
				type: q.type,
				level: q.level,
				choices: (q.choices ?? []).map((c) => ({
					id: c.id,
					answer: c.answer,
				})),
				answer:
					q.type === QuestionType.FILL_IN_THE_BLANK
						? q.answer!
						: q.choices?.find((c) => c.isCorrect)?.id,
			}));
		}

		const result: TestQuestionDto = { questions: data, totalQuestions };

		const endTime = new Date(
			test.startedTime.getTime() + test.duration * 60 * 1000,
		);
		const ttl = Math.floor((endTime.getTime() - Date.now()) / 1000);

		if (ttl > 0) {
			await this.redisService.setCache(cacheKey, result, ttl);
		}

		return result;
	}

	async updateQuestion(questionId: string, question: UpdateQuestionReqDto) {
		const existingQuestion = await this.questionRepository.findOne({
			where: { id: questionId },
			relations: ["test", "choices"],
		});

		if (!existingQuestion) {
			throw new BaseException(404, "QUESTION_NOT_FOUND");
		}

		existingQuestion.question = question.question;
		existingQuestion.type = question.questionType;
		existingQuestion.level = question.difficulty;

		if (question.questionType === QuestionType.FILL_IN_THE_BLANK) {
			existingQuestion.answer = question.answer;
			if (existingQuestion.choices && existingQuestion.choices.length > 0) {
				await this.questionRepository.manager
					.getRepository(ChoiceEntity)
					.delete({ question: { id: questionId } });
			}
		} else {
			const newChoices = question.options!.map(
				(option: { id: string; answer: string }) => {
					const choice = new ChoiceEntity();
					choice.answer = option.answer;
					choice.isCorrect = option.id === question.answer;
					choice.question = existingQuestion;
					return choice;
				},
			);
			await this.questionRepository.manager
				.getRepository(ChoiceEntity)
				.delete({ question: { id: questionId } });
			existingQuestion.choices = newChoices;
		}
		await this.questionRepository.save(existingQuestion);

		const testId = existingQuestion.test.id;
		const keysToInvalidate = await this.redisService.getKeys(
			`exam_questions:${testId}:*`,
		);
		for (const key of keysToInvalidate) {
			await this.redisService.delCache(key);
		}

		return existingQuestion;
	}

	async deleteQuestion(questionId: string) {
		const existingQuestion = await this.questionRepository.findOne({
			where: { id: questionId },
			relations: ["test", "choices"],
		});

		if (!existingQuestion) {
			throw new BaseException(404, "QUESTION_NOT_FOUND");
		}

		await this.questionRepository.delete({ id: questionId });

		const testId = existingQuestion.test.id;
		const keysToInvalidate = await this.redisService.getKeys(
			`exam_questions:${testId}:*`,
		);
		for (const key of keysToInvalidate) {
			await this.redisService.delCache(key);
		}
	}
}
