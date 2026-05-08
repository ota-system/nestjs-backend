import { Expose } from "class-transformer";

export class OverviewInfoRequestDto {
	@Expose()
	totalClasses!: number;

	@Expose()
	totalTests!: number;

	@Expose()
	totalStudents!: number;
}
