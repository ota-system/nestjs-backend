import { Expose, Transform, Type } from "class-transformer";

export class TestResultResponseDto {
	@Expose()
	id!: string;

	@Expose()
	testName!: string;

	@Expose()
	className!: string;

	@Expose()
	@Transform(({ value }) => Number(value) ?? 0)
	score!: number;

	@Expose()
	@Transform(({ value }) => Number(value) ?? 0)
	correctRate!: number;

	@Expose()
	@Type(() => Number)
	timeSpent!: number;

	@Expose()
	@Type(() => Date)
	testDate!: Date;

	@Expose()
	@Transform(({ value }) => Number(value) ?? 0)
	fraudCount!: number;
}
