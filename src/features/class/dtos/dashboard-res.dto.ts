import { Expose, Type } from "class-transformer";

class GpaDistributionDto {
	@Expose()
	grade!: number;

	@Expose()
	count!: number;
}

class GpaAcrossTopicDto {
	@Expose()
	topic!: string;

	@Expose()
	avg!: number;
}

class TestGradeDto {
	@Expose()
	grade!: number;

	@Expose()
	count!: number;
}

class StudentScoreDto {
	@Expose()
	student!: string;

	@Expose()
	score!: number;
}

class AvailableTestDto {
	@Expose()
	id!: string;

	@Expose()
	name!: string;

	@Expose()
	createdAt!: Date;
}

export class ClassDashboardResponseDto {
	@Expose()
	className!: string;

	@Expose()
	@Type(() => GpaDistributionDto)
	gpaDistribution!: GpaDistributionDto[];

	@Expose()
	@Type(() => GpaAcrossTopicDto)
	gpaAcrossTopics!: GpaAcrossTopicDto[];

	@Expose()
	classTopicAvgScore!: number;

	@Expose()
	@Type(() => AvailableTestDto)
	availableTests!: AvailableTestDto[];
}

export class TestDashboardResponseDto {
	@Expose()
	testId!: string;

	@Expose()
	testName!: string;

	@Expose()
	@Type(() => TestGradeDto)
	testGrades!: TestGradeDto[];

	@Expose()
	@Type(() => StudentScoreDto)
	studentScores!: StudentScoreDto[];
}
