import { Expose } from "class-transformer";
export class SubmitTestResponseDto {
	@Expose()
	resultId!: string;

	@Expose()
	score!: GLfloat;

	@Expose()
	correctRate!: GLfloat;

	@Expose()
	subject!: string;

	@Expose()
	correctQuestions!: number;

	@Expose()
	totalQuestions!: number;
}
