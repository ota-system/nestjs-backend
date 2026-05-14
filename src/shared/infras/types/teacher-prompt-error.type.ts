import z from "zod";
import TeacherExceptionSchema from "../schema/teacher-exception.schema";

export type TeacherPromptError = z.infer<typeof TeacherExceptionSchema>;
