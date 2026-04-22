import { IsNotEmpty, IsString } from "class-validator";

export class TeacherPromptRequestDto {
	@IsString()
	@IsNotEmpty()
	prompt!: string;
}
