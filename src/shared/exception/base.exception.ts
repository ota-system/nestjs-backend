export class BaseException {
	constructor(
		public readonly message: string,
		public readonly status: number,
		public readonly code: string,
		public readonly details: string[] | null = null,
	) {}
}
