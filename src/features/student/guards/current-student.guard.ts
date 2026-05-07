import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AccessJwtPayload } from "../../auth/auth.type";

@Injectable()
export class CurrentStudent implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const user: AccessJwtPayload = request.user;
		const { params } = request;
		return user.sub === params.studentId;
	}
}
