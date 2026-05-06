import { Expose, Type } from "class-transformer";

export class TestResultInfo {
	@Expose()
	testResultId!: string;

	@Expose()
	testName!: string;

	@Expose()
	teacherName!: string;

	@Expose()
	completedAt!: Date;

	@Expose()
	topic!: string;

	@Expose()
	totalQuestions!: number;

	@Expose()
	score!: number;

	@Expose()
	correctRate!: number;
}

export class QuestionResult {
	@Expose()
	questionId!: string;

	@Expose()
	isCorrect!: boolean;
}

export class StudentResultResponse {
	@Expose()
	@Type(() => TestResultInfo)
	testResultInfo!: TestResultInfo;

	@Expose()
	@Type(() => QuestionResult)
	questionResults!: QuestionResult[];
}
