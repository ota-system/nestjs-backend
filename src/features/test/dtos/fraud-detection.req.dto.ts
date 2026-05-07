import { IsString } from "class-validator";
import { FraudType } from "../type";

export class FraudDetectionRequestDto {
	@IsString()
	fraudType!: FraudType;
}
