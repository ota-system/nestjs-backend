import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChoiceEntity } from "../../database/entities/choice.entity";
import { ClassEntity } from "../../database/entities/class.entity";
import { QuestionEntity } from "../../database/entities/question.entity";
import { StudentClassEntity } from "../../database/entities/student-class.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { QuestionService } from "./question.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([
			TestEntity,
			QuestionEntity,
			ChoiceEntity,
			ClassEntity,
			StudentClassEntity,
		]),
	],
	controllers: [],
	providers: [QuestionService],
	exports: [QuestionService],
})
export class QuestionModule {}
