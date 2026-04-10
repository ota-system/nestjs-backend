import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { Request, Response } from "express";
import { ErrorResponseDto } from "../dtos/error-response.dto";
import { BaseException } from "../exception/base.exception";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	catch(exception: any, host: ArgumentsHost): any {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		let errorResponse: ErrorResponseDto;

		if (exception instanceof BaseException) {
			errorResponse = new ErrorResponseDto(
				exception.message,
				exception.code,
				request.originalUrl,
				exception.details,
			);
		} else {
			errorResponse = new ErrorResponseDto(
				exception.message,
				"DEFAULT-ERROR",
				request.originalUrl,
				null,
			);
		}

		response.status(exception.status || 500).json(errorResponse);
	}
}
