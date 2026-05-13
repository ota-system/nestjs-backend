import { z } from "zod";
import TeacherQuestionSchema from "../schema/teacher-question.schema";

type TeacherQuestion = z.infer<typeof TeacherQuestionSchema>;

export default TeacherQuestion;
