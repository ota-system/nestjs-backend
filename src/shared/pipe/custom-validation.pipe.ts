import { ValidationPipe } from "@nestjs/common";
import { BaseException } from "../exception/base.exception";

export const CustomValidationPipe = new ValidationPipe({
	whitelist: true,
	transform: true,

	exceptionFactory: (errors) => {
		const messages = errors.flatMap((err) =>
			Object.values(err.constraints ?? {}),
		);

		return new BaseException("Bad request", 400, "INVALID_INPUT", messages);
	},
});
