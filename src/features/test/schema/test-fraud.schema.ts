import { z } from "zod";
import { FraudType } from "../type";

const TestFraudSchema = z.object({
	type: z.enum(FraudType),
	times: z.number().min(1),
});

export const TestFraudListSchema = z.object({
	frauds: z.array(TestFraudSchema),
});
