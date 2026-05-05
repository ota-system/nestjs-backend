import { Expose, Type } from "class-transformer";

export class TestStatsDto {
	@Expose()
	attempts!: number;

	@Expose()
	averageScore!: number;

	@Expose()
	highestScore!: number;
}

export class TestWithStatsResponseDto {
	@Expose()
	id!: string;

	@Expose()
	testName!: string;

	@Expose()
	duration!: number;

	@Expose()
	totalQuestions!: number;

	@Expose()
	maxScore!: number;

	@Expose()
	antiCheating!: boolean;

	@Expose()
	topicName?: string;

	@Expose()
	@Type(() => TestStatsDto)
	stats!: TestStatsDto;
}
