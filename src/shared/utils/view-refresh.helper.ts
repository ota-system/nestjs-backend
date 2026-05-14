import { Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import { REFRESH_VIEW_QUEUE } from "../constants/queue.constant";

const logger = new Logger("ViewRefreshHelper");
let globalRefreshQueue: Queue | null = null;

export function setRefreshQueue(queue: Queue) {
	globalRefreshQueue = queue;
}

export async function triggerRefresh(viewName: string, action: string) {
	if (!globalRefreshQueue) {
		logger.warn(
			`Refresh queue not initialized for ${viewName}. Skipping refresh.`,
		);
		return;
	}

	try {
		await globalRefreshQueue.add(
			REFRESH_VIEW_QUEUE,
			{
				viewName,
				action,
				timestamp: new Date().toISOString(),
			},
			{
				jobId: `refresh-${viewName}-${Date.now()}`,
				removeOnComplete: true,
				attempts: 3,
				backoff: {
					type: "exponential",
					delay: 2000,
				},
			},
		);
		logger.debug(`Queued refresh for ${viewName} (${action})`);
	} catch (error) {
		logger.error(`Failed to queue view refresh for ${viewName}: ${error}`);
	}
}
