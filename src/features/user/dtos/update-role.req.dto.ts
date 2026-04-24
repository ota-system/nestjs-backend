import { IsEnum } from "class-validator";
import { UserRole } from "../../../shared/types/user-role.enum";

export class UpdateRoleRequestDto {
	@IsEnum(UserRole)
	role!: UserRole;
}
