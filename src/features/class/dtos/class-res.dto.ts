import { Expose, Transform, Type } from "class-transformer";
import { UserRole } from "../../auth/entities/user-role.enum";

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

	@Expose()
	//Because oof the avg score is not exist now => add transform to mock
	@Transform(({ value }) => value ?? 5)
	averageScore: number = 0;
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
