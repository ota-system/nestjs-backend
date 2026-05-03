import { Expose } from "class-transformer";

export class ExamResponseDto {
	@Expose()
	id!: string;

	@Expose()
	testName!: string;

	@Expose()
	duration!: number;

	@Expose()
	startedTime!: Date;
}
