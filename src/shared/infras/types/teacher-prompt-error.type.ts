import z from "zod";
import TeacherExceptionSchema from "../schema/teacher-exception.schema";

type TeacherPromptError = z.infer<typeof TeacherExceptionSchema>;

export default TeacherPromptError;
