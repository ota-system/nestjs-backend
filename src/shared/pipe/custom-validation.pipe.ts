import { ValidationPipe } from "@nestjs/common";
import { ErrorDetailDto } from "../dtos/error-detail.dto";
import { BaseException } from "../exception/base.exception";

export const CustomValidationPipe = new ValidationPipe({
	whitelist: true,
	transform: true,

	exceptionFactory: (errors) => {
		const details = errors.map(
			(err) =>
				new ErrorDetailDto(
					err.property,
					Object.values(err.constraints ?? {})[0] as string,
				),
		);

		return new BaseException("Bad request", 400, "INVALID_INPUT", details);
	},
});
