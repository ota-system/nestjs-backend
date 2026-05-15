import z from "zod";
import { Difficulty } from "../../interface/QuestionObject";
import { QuestionType } from "../../types/question-type.enum";

const TeacherQuestionSchema = z.object({
	id: z.union([z.string(), z.number()]).transform(String),
	question: z.string().min(1),
	topic: z.string().min(1),
	difficulty: z.enum(Object.values(Difficulty)),
	options: z.array(z.string()),
	question_type: z.enum(Object.values(QuestionType)),
	answer: z.union([z.string(), z.number()]).transform(String),
	explanation: z.string().min(1),
});

export default TeacherQuestionSchema;
