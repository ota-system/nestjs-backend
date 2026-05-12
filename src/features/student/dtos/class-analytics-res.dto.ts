import { Expose, Transform } from "class-transformer";

export class ClassAnalyticsItemDto {
	@Expose()
	testName!: string;

	@Expose()
	@Transform(({ value }) => Number(value ?? 0))
	myScore!: number;

	@Expose()
	@Transform(({ value }) => Number(value ?? 0))
	classAvgScore!: number;

	@Expose()
	@Transform(({ value }) => Number(value ?? 0))
	classMaxScore!: number;

	@Expose()
	@Transform(({ value }) => Number(value ?? 0))
	classMinScore!: number;
}
