import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChoiceEntity } from "../../database/entities/choice.entity";
import { QuestionEntity } from "../../database/entities/question.entity";
import { SharedModule } from "../../shared/shared.module";
import { QuestionService } from "./question.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([QuestionEntity, ChoiceEntity]),
		SharedModule,
	],
	controllers: [],
	providers: [QuestionService],
	exports: [QuestionService],
})
export class QuestionModule {}
