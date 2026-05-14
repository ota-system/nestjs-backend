import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { DataSource } from "typeorm";
import { REFRESH_VIEW_QUEUE } from "../../../shared/constants/queue.constant";

@Processor(REFRESH_VIEW_QUEUE, { concurrency: 1 })
export class RefreshDashboardViewProcessor extends WorkerHost {
	constructor(private readonly datasource: DataSource) {
		super();
	}

	async process(job: Job<any, any, string>) {
		const { viewName } = job.data;
		Logger.log(`Refreshing view: ${viewName}`);
		await this.datasource.query(
			`REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName}`,
		);
		Logger.log(`Successfully refreshed view: ${viewName}`);
	}
}
