import { BaseException } from "../../../shared/exception/base.exception";

export class EmailAlreadyRegisteredException extends BaseException {
	constructor() {
		super(
			"Email is already registered. Please use another email or sign in.",
			400,
			"EMAIL_ALREADY_REGISTERED",
		);
	}
}
