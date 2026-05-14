import { IsString } from "class-validator";
import { FraudType } from "../type";

export class CreateTestFraudReqDto {
	@IsString()
	fraudType!: FraudType;
}
