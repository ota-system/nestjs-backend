import { Expose, Type } from "class-transformer";

export class OptionDto {
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
	@Type(() => OptionDto)
	options!: OptionDto[];
}

export class ExamResponseDto {
	@Expose()
	id!: string;

	@Expose()
	name!: string;

	@Expose()
	duration!: number;

	@Expose()
	start_time!: Date;

	@Expose()
	server_time!: Date;

	@Expose()
	@Type(() => ExamQuestionDto)
	questions!: ExamQuestionDto[];
}
