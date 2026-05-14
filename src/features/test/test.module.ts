import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ChoiceEntity } from "../../database/entities/choice.entity";
import { ClassEntity } from "../../database/entities/class.entity";
import { QuestionEntity } from "../../database/entities/question.entity";
import { StudentClassEntity } from "../../database/entities/student-class.entity";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { TestEntity } from "../../database/entities/test.entity";
import {
	UniversalInvalidateCacheInterceptor,
	UniversalSmartCacheInterceptor,
} from "../../shared/interceptors/smart-cache.interceptor";
import { StudentResultService } from "../../shared/services/student-result.service";
import { SharedModule } from "../../shared/shared.module";
import { AnalysisModule } from "../analysis/analysis.module";
import { QuestionModule } from "../question/question.module";
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
		QuestionModule,
		AnalysisModule,
	],
	controllers: [TestController],
	providers: [
		TestService,
		StudentResultService,
		UniversalSmartCacheInterceptor,
		UniversalInvalidateCacheInterceptor,
	],
	exports: [TestService],
})
export class TestModule {}
