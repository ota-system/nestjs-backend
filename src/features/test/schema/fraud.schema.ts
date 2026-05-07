import { z } from "zod";
import { FraudType } from "../type";

const FraudSchema = z.object({
	type: z.enum(FraudType),
	times: z.number().min(1),
});

export const FraudDetectionSchema = z.object({
	frauds: z.array(FraudSchema),
});
