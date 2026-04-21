import { IsString, Length } from "class-validator";

export class CreateClassRequestDto {
	@IsString()
	@Length(2, 255)
	name!: string;

	@IsString()
	@Length(2, 255)
	subject!: string;
}
