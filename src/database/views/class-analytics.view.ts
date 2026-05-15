import { Index, ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
	name: "vw_class_analytics",
	materialized: true,
})
@Index(["testId"], { unique: true })
@Index(["classId"])
export class ClassAnalyticsView {
	@ViewColumn({ name: "test_id" })
	testId!: string;

	@ViewColumn({ name: "test_name" })
	testName!: string;

	@ViewColumn({ name: "class_id" })
	classId!: string;

	@ViewColumn({ name: "class_avg_score" })
	classAvgScore!: number;

	@ViewColumn({ name: "class_max_score" })
	classMaxScore!: number;

	@ViewColumn({ name: "class_min_score" })
	classMinScore!: number;

	@ViewColumn({ name: "started_time" })
	startedTime!: Date;
}
