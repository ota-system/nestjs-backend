import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OpenRouter } from "@openrouter/sdk";
import { OpenRouterService } from "../../shared/infras/openRouter.service";
import { SharedModule } from "../../shared/shared.module";
import { UserEntity } from "../auth/entities/user.entity";
import { TestGenerationController } from "./test-generation.controller";
@Module({
	imports: [TypeOrmModule.forFeature([UserEntity]), SharedModule],
	providers: [OpenRouterService, OpenRouter],
	controllers: [TestGenerationController],
	exports: [],
})
export class TestGenerationModule {}
