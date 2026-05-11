import { Expose } from "class-transformer";

export class TeacherClassStatsDto {
	@Expose()
	totalClasses!: number;

	@Expose()
	totalStudents!: number;

	@Expose()
	totalTests!: number;
}

export class StudentClassStatsDto {
	@Expose()
	totalClasses!: number;

	@Expose()
	totalTestResults!: number;

	@Expose()
	averageScore!: number;
}
