export class ErrorResponseDto {
	public readonly timestamp: Date = new Date();
	constructor(
		public readonly message: string,
		public readonly code: string,
		public readonly path: string,
		public readonly details: string[] | null,
	) {}
}
