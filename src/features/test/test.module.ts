import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ChoiceEntity } from "../../database/entities/choice.entity";
import { ClassEntity } from "../../database/entities/class.entity";
import { QuestionEntity } from "../../database/entities/question.entity";
import { StudentClassEntity } from "../../database/entities/student-class.entity";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { TestEntity } from "../../database/entities/test.entity";

import { SharedModule } from "../../shared/shared.module";
import { TestController } from "./test.controller";
import { TestService } from "./test.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([
			TestEntity,
			QuestionEntity,
			ChoiceEntity,
			StudentResultEntity,
			ClassEntity,
			StudentClassEntity,
		]),
		SharedModule,
	],
	controllers: [TestController],
	providers: [TestService],
})
export class TestModule {}
