import { IsEmail, IsEnum, IsNotEmpty, MinLength } from "class-validator";
import { UserRole } from "../../../shared/types/user-role.enum";

export class SignUpDto {
	@IsNotEmpty()
	@MinLength(2)
	fullName!: string;

	@IsEmail()
	email!: string;

	@IsNotEmpty()
	@MinLength(6)
	password!: string;

	@IsNotEmpty()
	@IsEnum(UserRole, {
		message: "Role must be either TEACHER or STUDENT",
	})
	role!: UserRole; //2 options: 'TEACHER' | 'STUDENT'
}
