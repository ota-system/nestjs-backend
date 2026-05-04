import { z } from "zod";

const QuestionSchema = z.object({
	id: z.string(),
	title: z.string(),
	question: z.string(),
	type: z.string(),
	level: z.string(),
	choices: z.array(
		z.object({
			id: z.string(),
			answer: z.string(),
		}),
	),
});

export const TestQuestionSchema = z.object({
	questions: z.array(QuestionSchema),
	totalQuestions: z.number(),
});
