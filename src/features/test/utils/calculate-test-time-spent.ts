import z from "zod";
import { RedisService } from "../../../shared/redis/redis.service";

export const calculateTestTimeSpent = async (
	redisService: RedisService,
	testId: string,
	studentId: string,
): Promise<number> => {
	const testStartTimeKey = `test_start_time:${testId}:${studentId}`;
	const startTimestamp = await redisService.getCache<number>(
		testStartTimeKey,
		z.number(),
	);
	if (startTimestamp && typeof startTimestamp === "number") {
		const elapsedMs = Date.now() - startTimestamp;
		const timespent = Math.max(Math.floor(elapsedMs / 60000), 0);
		await redisService.delCache(testStartTimeKey);
		return timespent;
	}
	return 0;
};
