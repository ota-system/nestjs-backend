import type { ErrorDetailDto } from "./error-detail.dto";

export class ErrorResponseDto {
	public readonly timestamp: Date = new Date();
	constructor(
		public readonly message: string,
		public readonly code: string,
		public readonly path: string,
		public readonly details: ErrorDetailDto[] | null = null,
	) {}
}
