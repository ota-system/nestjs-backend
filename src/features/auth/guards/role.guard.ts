import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../../../shared/decorators/roles.decorator";
import { UserRole } from "../../../shared/types/user-role.enum";
import { AccessJwtPayload } from "../auth.type";

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()],
		);
		if (!requiredRoles || requiredRoles.length === 0) {
			return true;
		}
		const payload = context.switchToHttp().getRequest();
		const user: AccessJwtPayload = payload.user;
		return requiredRoles.includes(user.role as UserRole);
	}
}
