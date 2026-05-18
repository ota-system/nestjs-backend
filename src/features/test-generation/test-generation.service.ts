import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChoiceEntity } from "../../database/entities/choice.entity";
import { ClassEntity } from "../../database/entities/class.entity";
import { QuestionEntity } from "../../database/entities/question.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { TopicEntity } from "../../database/entities/topic.entity";
import { BaseException } from "../../shared/exception/base.exception";
import { AiTokenService } from "../../shared/services/ai-token.service";
import { PdfParserService } from "../../shared/services/pdf-parser.service";
import { QuestionType } from "../../shared/types/question-type.enum";
import { SavedTestRequestDto } from "./dtos/saved-test.req.dto";

@Injectable()
export class TestGenerationService {
	private readonly logger = new Logger(TestGenerationService.name);
	constructor(
		@InjectRepository(TestEntity)
		private readonly testRepository: Repository<TestEntity>,

		@InjectRepository(ClassEntity)
		private readonly classRepository: Repository<ClassEntity>,

		private readonly pdfParserService: PdfParserService,
		private readonly aiTokenService: AiTokenService,
	) {}

	async extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
		const text = await this.pdfParserService.parse(fileBuffer);

		if (!text || text.length < 50) {
			throw new BaseException(400, "PDF_CONTENT_TOO_SHORT_OR_SCANNED");
		}

		const tokens = this.aiTokenService.estimateTokenCount(text);
		if (tokens > 15000) {
			throw new BaseException(400, "TOKEN_LIMIT_EXCEEDED");
		}

		return text;
	}

	async saveAIGeneratedTest(dto: SavedTestRequestDto): Promise<boolean> {
		const {
			testName,
			topicName,
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
					type: questionType,
					answer:
						questionType === QuestionType.FILL_IN_THE_BLANK ? answer : null,
					explanation,
				});
				const savedQuestion = await questionRepository.save(questionEntity);
				if (
					questionType === QuestionType.MULTIPLE_CHOICE ||
					questionType === QuestionType.TRUE_FALSE
				) {
					const choiceRepository = manager.getRepository(ChoiceEntity);
					for (const option of options) {
						const choice = choiceRepository.create({
							question: savedQuestion,
							answer: option,
							isCorrect: option === answer,
						});
						await choiceRepository.save(choice);
					}
				}
			}
		});

		return true;
	}

	async checkTeacherPermission(
		ClassId: string,
		teacherId: string,
	): Promise<boolean> {
		const existingClass = await this.classRepository.findOne({
			where: { id: ClassId },
			relations: ["teacher"],
		});
		if (!existingClass) {
			return false;
		}
		return existingClass.teacher.id === teacherId;
	}
}
