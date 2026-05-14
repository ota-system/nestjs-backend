import { z } from "zod";
import TeacherQuestionSchema from "../schema/teacher-question.schema";

export type TeacherQuestion = z.infer<typeof TeacherQuestionSchema>;
