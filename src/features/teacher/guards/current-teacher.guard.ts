import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AccessForbiddenException } from "../../../shared/exception/access-forbidden.exception";

@Injectable()
export class CurrentTeacherGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		return this.validate(request);
	}

	validate(request: any) {
		const user = request.user;
		const teacherId = request.params.teacherId;
		if (user.sub !== teacherId) {
			throw new AccessForbiddenException();
		}
		return true;
	}
}
