export class BaseResponse<T> {
	constructor(
		public readonly data: T,
		public readonly messages: string,
		public readonly metadata: any,
	) {}
}
