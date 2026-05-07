import { BaseException } from "./base.exception";

export class AccessForbiddenException extends BaseException {
	constructor(public readonly code = "RESOURCE_ACCESS_DENIED") {
		super(403, code, null);
	}
}
