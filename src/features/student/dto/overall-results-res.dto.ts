import { Expose, Transform } from "class-transformer";

export class OverallResultResponseDto {
	@Expose()
	@Transform(({ value }) => Number(value ?? 0))
	totalTests!: number;

	@Expose()
	@Transform(({ value }) => Number((value ?? 0).toFixed?.(2) ?? 0))
	averageScore!: number;

	@Expose()
	@Transform(({ value }) => Number(value ?? 0))
	highestScore!: number;

	@Expose()
	@Transform(({ value }) => Number(value ?? 0))
	lowestScore!: number;
}
