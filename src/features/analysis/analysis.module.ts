import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClassEntity } from "../../database/entities/class.entity";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { StudentClassGpaView } from "../../database/views/student-class-gpa.view";
import { TopicAvgScoreView } from "../../database/views/topic-avg-score.view";
import { REFRESH_VIEW_QUEUE } from "../../shared/constants/queue.constant";
import { AnalysisService } from "./analysis.service";
import { RefreshDashboardViewProcessor } from "./queues/refresh-dashboard-view.processor";

@Module({
	imports: [
		TypeOrmModule.forFeature([
			ClassEntity,
			TestEntity,
			StudentResultEntity,
			StudentClassGpaView,
			TopicAvgScoreView,
		]),
		BullModule.registerQueue({ name: REFRESH_VIEW_QUEUE }),
	],
	providers: [AnalysisService, RefreshDashboardViewProcessor],
	exports: [AnalysisService],
})
export class AnalysisModule {}
