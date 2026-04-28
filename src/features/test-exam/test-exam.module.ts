import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChoiceEntity } from "../../database/entities/choice.entity";
import { QuestionEntity } from "../../database/entities/question.entity";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { SharedModule } from "../../shared/shared.module";
import { TestExamController } from "./test-exam.controller";
import { TestExamService } from "./test-exam.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([
			TestEntity,
			QuestionEntity,
			ChoiceEntity,
			StudentResultEntity,
		]),
		SharedModule,
	],
	providers: [TestExamService],
	controllers: [TestExamController],
})
export class TestExamModule {}
