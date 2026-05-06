import { Expose, Type } from "class-transformer";

export class ChoiceDto {
	@Expose()
	id!: string;

	@Expose()
	choice!: string;

	@Expose()
	isCorrect!: boolean;
}

export class QuestionDetailResponse {
	@Expose()
	id!: string;

	@Expose()
	question!: string;

	@Expose()
	type!: string;

	@Expose()
	@Type(() => ChoiceDto)
	choices!: ChoiceDto[];

	@Expose()
	answer!: string | null;

	@Expose()
	explaination!: string | null;

	@Expose()
	studentOptionId!: string | null;

	@Expose()
	studentAnswer!: string | null;

	@Expose()
	isCorrect!: boolean | null;
}

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
