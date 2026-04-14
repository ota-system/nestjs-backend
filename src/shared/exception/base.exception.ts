import type { ErrorDetailDto } from "../dtos/error-detail.dto";

export class BaseException {
	constructor(
		public readonly message: string,
		public readonly status: number,
		public readonly code: string,
		public readonly details: ErrorDetailDto[] | null = null,
	) {}
}
