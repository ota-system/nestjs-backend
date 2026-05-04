import { Expose, Type } from "class-transformer";

export class TestSummaryDto {
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

export class TestListResponseDto {
	@Expose()
	@Type(() => TestSummaryDto)
	tests!: TestSummaryDto[];

	@Expose()
	total!: number;
}
