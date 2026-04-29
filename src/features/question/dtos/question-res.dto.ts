import { Expose, Type } from "class-transformer";

export class ChoiceDto {
	@Expose()
	id!: string;

	@Expose()
	answer!: string;
}

export class ExamQuestionDto {
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
