import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClassEntity } from "../../database/entities/class.entity";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { StudentClassGpaView } from "../../database/views/student-class-gpa.view";
import { TopicAvgScoreView } from "../../database/views/topic-avg-score.view";
import { AnalysisService } from "./analysis.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([
			ClassEntity,
			TestEntity,
			StudentResultEntity,
			StudentClassGpaView,
			TopicAvgScoreView,
		]),
	],
	providers: [AnalysisService],
	exports: [AnalysisService],
})
export class AnalysisModule {}
