import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OpenRouter } from "@openrouter/sdk";
import { OpenRouterService } from "../../shared/infras/openRouter.service";
import { SharedModule } from "../../shared/shared.module";
import { TestGenerationController } from "./test-generation.controller";
@Module({
	imports: [SharedModule],
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
	],
	controllers: [TestGenerationController],
	exports: [],
})
export class TestGenerationModule {}
