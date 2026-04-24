import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QuestionEntity } from "../../database/entities/question.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { TopicEntity } from "../../database/entities/topic.entity";
import { SavedTestRequestDto } from "./dtos/saved-test.req.dto";

@Injectable()
export class TestGenerationService {
	constructor(
		@InjectRepository(TopicEntity)
		private readonly topicRepository: Repository<TopicEntity>,

		@InjectRepository(QuestionEntity)
		private readonly questionRepository: Repository<QuestionEntity>,

		@InjectRepository(TestEntity)
		private readonly testRepository: Repository<TestEntity>,
	) {}

	async saveAIGeneratedTest(dto: SavedTestRequestDto): Promise<boolean> {
		const {
			testName,
			classId,
			startedTime,
			duration,
			questions,
			antiCheating,
		} = dto;

		await this.testRepository.manager.transaction(async (manager) => {
			const topicRepository = manager.getRepository(TopicEntity);
			const testRepository = manager.getRepository(TestEntity);
			const questionRepository = manager.getRepository(QuestionEntity);

			const topicName = questions[0].topic;
			let topic = await topicRepository.findOneBy({ topicName });

			if (!topic) {
				topic = topicRepository.create({ topicName });
				topic = await topicRepository.save(topic);
			}

			const test = testRepository.create({
				testName,
				class: { id: classId },
				topic,
				startedTime: new Date(startedTime),
				duration,
				antiCheating,
			});
			const savedTest = await testRepository.save(test);

			for (const questionDto of questions) {
				const {
					question,
					difficulty,
					options,
					questionType,
					answer,
					explanation,
				} = questionDto;
				const questionEntity = questionRepository.create({
					test: savedTest,
					question,
					level: difficulty,
					options,
					type: questionType,
					answer,
					explanation,
				});
				await questionRepository.save(questionEntity);
			}
		});

		return true;
	}
}
