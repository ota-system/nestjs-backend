import {
	type ArgumentsHost,
	Catch,
	type ExceptionFilter,
	HttpException,
	Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { I18nService } from "nestjs-i18n";
import type { ErrorDetailDto } from "../dtos/error-detail.dto";
import { ErrorResponseDto } from "../dtos/error-response.dto";
import { BaseException } from "../exception/base.exception";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	constructor(private readonly i18n?: I18nService) {}

	async catch(exception: any, host: ArgumentsHost): Promise<any> {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		const lang =
			(request.query.lang as string) ||
			(request.query.l as string) ||
			(request.headers["x-lang"] as string) ||
			"vi";

		let status = 500;
		let code = "DEFAULT_ERROR";
		let message = exception.message || "Internal server error";
		let details: ErrorDetailDto[] | null = null;

		if (exception instanceof BaseException) {
			status = exception.status;
			code = exception.code;
			details = exception.details
				? await Promise.all(
						exception.details.map(async (detail) => {
							const translatedDetailMessage = this.i18n
								? await this.i18n.translate(detail.messageKey, { lang })
								: detail.messageKey;

							return {
								...detail,
								message: translatedDetailMessage,
							};
						}),
					)
				: null;
			message = code;
			if (this.i18n) {
				try {
					message = await this.i18n.translate(`errors.${code}`, { lang });
				} catch {}
			}
		} else if (exception instanceof HttpException) {
			status = exception.getStatus();
			const responseBody = exception.getResponse();
			if (typeof responseBody === "object" && responseBody !== null) {
				message = (responseBody as any).message || message;
			}
		} else {
			Logger.error(exception.message, exception.stack, "GlobalExceptionFilter");
		}

		const errorResponse = new ErrorResponseDto(
			message,
			code,
			request.originalUrl,
			details,
		);

		response.status(status).json(errorResponse);
	}
}
