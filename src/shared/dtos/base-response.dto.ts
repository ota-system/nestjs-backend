export class BaseResponse<T> {
	constructor(
		public readonly data: T,
		public readonly message: string = "Success",
		public readonly metadata?: any,
	) {}

	// add a static method for convenience wrap response
	static ok<T>(
		data: T,
		message: string = "Success",
		metadata?: any,
	): BaseResponse<T> {
		return new BaseResponse(data, message, metadata);
	}
}
