import { Expose } from "class-transformer";

export class UserResponseDto {
	@Expose()
	id!: string;

	@Expose()
	fullName!: string;

	@Expose()
	email!: string;

	@Expose()
	role!: string;

	@Expose()
	avatarUrl!: string | null;

	@Expose()
	isActive!: boolean;

	@Expose()
	createdAt!: Date;
}
