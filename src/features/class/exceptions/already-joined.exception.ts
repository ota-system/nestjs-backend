import { BaseException } from "../../../shared/exception/base.exception";

export class AlreadyJoinedException extends BaseException {
	constructor() {
		super(400, "ALREADY_JOINED_CLASS", null);
	}
}
