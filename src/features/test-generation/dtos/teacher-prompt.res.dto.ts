import { Expose } from "class-transformer";

export class TeacherPromptResponseDto {
	@Expose()
	id!: number;

	@Expose()
	question!: string;

	@Expose()
	topic!: string;

	@Expose()
	difficulty!: string;

	@Expose()
	options?: Array<string>;

	@Expose()
	questionType!: string;

	@Expose()
	answer!: string;

	@Expose()
	explanation!: string;
}
