import { Expose, Type } from "class-transformer";

export class ExamSummaryDto {
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

export class ExamListResponseDto {
	@Expose()
	@Type(() => ExamSummaryDto)
	exams!: ExamSummaryDto[];

	@Expose()
	total!: number;
}
