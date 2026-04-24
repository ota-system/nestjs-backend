import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OpenRouter } from "@openrouter/sdk";
import { ClassEntity } from "../../database/entities/class.entity";
import { QuestionEntity } from "../../database/entities/question.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { TopicEntity } from "../../database/entities/topic.entity";
import { OpenRouterService } from "../../shared/infras/openRouter.service";
import { SharedModule } from "../../shared/shared.module";
import { TestGenerationController } from "./test-generation.controller";
import { TestGenerationService } from "./test-generation.service";
@Module({
	imports: [
		TypeOrmModule.forFeature([
			TestEntity,
			ClassEntity,
			TopicEntity,
			QuestionEntity,
		]),
		SharedModule,
	],
	providers: [
		OpenRouterService,
		{
			provide: OpenRouter,
			useFactory: (configService: ConfigService) =>
				new OpenRouter({
					apiKey: configService.get<string>("OPENROUTER_API_KEY"),
				}),
			inject: [ConfigService],
		},
		TestGenerationService,
	],
	controllers: [TestGenerationController],
	exports: [],
})
export class TestGenerationModule {}
