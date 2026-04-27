import { applyDecorators, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../features/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../features/auth/guards/role.guard";
import { UserRole } from "../types/user-role.enum";
import { Roles } from "./roles.decorator";

export function Auth(...roles: UserRole[]) {
	return applyDecorators(Roles(...roles), UseGuards(JwtAuthGuard, RolesGuard));
}
