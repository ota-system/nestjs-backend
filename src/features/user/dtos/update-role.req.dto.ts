import { IsEnum } from "class-validator";
import { UserRole } from "../../auth/entities/user-role.enum";

export class UpdateRoleRequest {
	@IsEnum(UserRole)
	role!: UserRole;
}
