import { ErrorDetailDto } from "../../../shared/dtos/error-detail.dto";
import { BaseException } from "../../../shared/exception/base.exception";
export class EmailAlreadyRegisteredException extends BaseException {
	constructor() {
		super(400, "EMAIL_ALREADY_REGISTERED", [
			new ErrorDetailDto("email", "errors.EMAIL_ALREADY_REGISTERED"),
		]);
	}
}
