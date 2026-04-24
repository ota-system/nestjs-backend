import { Expose, Type } from "class-transformer";
import { UserRole } from "../../../shared/types/user-role.enum";

// This DTO use for both Teacher and Student. (curently both of them have same response, but in the future if we want to add more field for teacher or student, we can easily extend this DTO)
export class UserSummaryDto {
	@Expose()
	id!: string;

	@Expose()
	fullName!: string;

	@Expose()
	email!: string;

	@Expose()
	avatarUrl?: string;

	@Expose()
	role?: UserRole;
}

export class ClassResponseDto {
	@Expose()
	id!: string;

	@Expose()
	name!: string;

	@Expose()
	subject!: string;

	@Expose()
	code!: string;

	@Expose()
	@Type(() => UserSummaryDto)
	teacher!: UserSummaryDto;

	@Expose()
	createdAt!: Date;

	@Expose()
	updatedAt?: Date;
}
