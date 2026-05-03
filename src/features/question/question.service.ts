import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QuestionEntity } from "../../database/entities/question.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { RedisService } from "../../shared/redis/redis.service";

type QuestionsCache = {
	data: {
		id: string;
		question: string;
		type: string;
		level: string;
		choices: { id: string; answer: string }[];
	}[];
	total: number;
};

@Injectable()
export class QuestionService {
	constructor(
		@InjectRepository(QuestionEntity)
		private readonly questionRepository: Repository<QuestionEntity>,

		private readonly redisService: RedisService,
	) {}

	async getQuestionsForTest(test: TestEntity, page: number, limit: number) {
		const cacheKey = `exam_questions:${test.id}:p${page}:l${limit}`;

		const cached = await this.redisService.getCache<QuestionsCache>(cacheKey);
		if (cached) return cached;

		const [questions, total] = await this.questionRepository.findAndCount({
			where: { test: { id: test.id } },
			relations: { choices: true },
			skip: (page - 1) * limit,
			take: limit,
			order: { createdAt: "ASC" },
		});

		const data = questions.map((q) => ({
			id: q.id,
			question: q.question,
			type: q.type,
			level: q.level,
			choices: (q.choices ?? []).map((c) => ({
				id: c.id,
				answer: c.answer,
			})),
		}));

		const result: QuestionsCache = { data, total };

		const endTime = new Date(
			test.startedTime.getTime() + test.duration * 60 * 1000,
		);
		const ttl = Math.floor((endTime.getTime() - Date.now()) / 1000);

		if (ttl > 0) {
			await this.redisService.setCache(cacheKey, result, ttl);
		}

		return result;
	}
}
