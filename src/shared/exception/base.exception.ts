import type { ErrorDetailDto } from "../dtos/error-detail.dto";

export class BaseException extends Error {
	constructor(
		public readonly status: number,
		public readonly code: string,
		public readonly details: ErrorDetailDto[] | null = null,
	) {
		super(code);
	}
}
