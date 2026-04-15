import { UserRole } from "../entities/user-role.enum";

export class SignUpResDto {
	id!: string;
	fullName!: string;
	email!: string;
	role!: UserRole;
	avatarUrl?: string | null;
	createdAt!: Date;
}
