import { IsEmail, IsEnum, IsNotEmpty, MinLength } from "class-validator";
import { UserRole } from "../entities/user-role.enum";

export class SignUpDto {
	@IsNotEmpty()
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
