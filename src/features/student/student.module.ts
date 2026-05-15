import { BullModule, InjectQueue } from "@nestjs/bullmq";
import { Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Queue } from "bullmq";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { StudentResultSubscriber } from "../../database/subscribers/StudentResultSubscriber";
import { ClassAnalyticsView } from "../../database/views/class-analytics.view";
import { REFRESH_VIEW_QUEUE } from "../../shared/constants/queue.constant";
import { setRefreshQueue } from "../../shared/utils/view-refresh.helper";
import { StudentController } from "./student.controller";
import { StudentService } from "./student.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([StudentResultEntity, ClassAnalyticsView]),
		BullModule.registerQueue({ name: REFRESH_VIEW_QUEUE }),
	],
	controllers: [StudentController],
	providers: [StudentService, StudentResultSubscriber],
	exports: [StudentService],
})
export class StudentModule implements OnModuleInit {
	constructor(
		@InjectQueue(REFRESH_VIEW_QUEUE) private readonly refreshQueue: Queue,
	) {}

	onModuleInit() {
		setRefreshQueue(this.refreshQueue);
	}
}
