import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
	name: "vw_topic_avg_score",
})
export class TopicAvgScoreView {
	@ViewColumn({ name: "topic_id" })
	topicId!: string;

	@ViewColumn({ name: "topic_name" })
	topicName!: string;

	@ViewColumn({ name: "class_id" })
	classId!: string;

	@ViewColumn({ name: "avg_score" })
	avgScore!: number;
}
