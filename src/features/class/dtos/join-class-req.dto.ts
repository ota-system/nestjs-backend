import { IsNotEmpty, IsString, Length } from "class-validator";

export class JoinClassRequestDto {
	@IsNotEmpty()
	@IsString()
	@Length(6, 6, { message: "Độ dài của mã là 6" })
	code!: string;
}
