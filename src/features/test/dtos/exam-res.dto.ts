import { Expose } from "class-transformer";

export class ExamResponseDto {
	@Expose()
	id!: string;

	@Expose()
	name!: string;

	@Expose()
	duration!: number;

	@Expose()
	start_time!: Date;
}
