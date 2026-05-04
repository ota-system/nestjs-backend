import { Expose, Type } from "class-transformer";

export class ChoiceDto {
	@Expose()
	id!: string;

	@Expose()
	answer!: string;
}

export class QuestionDto {
	@Expose()
	id!: string;

	@Expose()
	question!: string;

	@Expose()
	type!: string;

	@Expose()
	level!: string;

	@Expose()
	@Type(() => ChoiceDto)
	choices!: ChoiceDto[];
}

export class TestQuestionDto {
	@Expose()
	questions!: QuestionDto[];

	@Expose()
	totalQuestions!: number;
}
