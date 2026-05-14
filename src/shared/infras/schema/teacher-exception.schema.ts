import z from "zod";

const TeacherExceptionSchema = z.object({
	code: z.string(),
	message: z.string().min(1),
	path: z.string().min(1),
	details: z.array(z.unknown()),
});

export default TeacherExceptionSchema;
