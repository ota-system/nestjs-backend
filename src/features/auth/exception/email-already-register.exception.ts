import { ErrorDetailDto } from "../../../shared/dtos/error-detail.dto";
import { BaseException } from "../../../shared/exception/base.exception";
export class EmailAlreadyRegisteredException extends BaseException {
	constructor() {
		super(
			"Email đã được sử dụng, vui lòng sử dụng một email khác.",
			400,
			"EMAIL_ALREADY_REGISTERED",
			[new ErrorDetailDto("email", "Email này đã được đăng ký")],
		);
	}
}
