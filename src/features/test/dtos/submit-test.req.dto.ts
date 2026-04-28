import { Type } from "class-transformer";
import {
	IsArray,
	IsNotEmpty,
	IsOptional,
	IsString,
	ValidateNested,
} from "class-validator";

class AnswerDto {
	@IsString()
	@IsNotEmpty()
	questionId!: string;

	@IsOptional()
	@IsString()
	optionId?: string;

	@IsOptional()
	@IsString()
	answer?: string;
}

export class SubmitTestRequestDto {
	@IsString()
	@IsNotEmpty()
	testId!: string;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => AnswerDto)
	answers!: AnswerDto[];
}
