import { Expose } from "class-transformer";

export class ExamDetailResponseDto {
	@Expose()
	id!: string;

	@Expose()
	testName!: string;

	@Expose()
	startedTime!: Date;

	@Expose()
	duration!: number;

	@Expose()
	totalQuestions!: number;

	@Expose()
	antiCheating!: boolean;

	@Expose()
	topic!: string;

	@Expose()
	createdAt!: Date;
}
