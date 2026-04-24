import {
	ArrayMaxSize,
	IsArray,
	IsBoolean,
	IsDateString,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsString,
} from "class-validator";
import {
	Difficulty,
	QuestionType,
} from "../../../shared/interface/QuestionObject";

class QuestionDto {
	@IsString()
	@IsNotEmpty()
	question!: string;

	@IsString()
	@IsNotEmpty()
	topic!: string;

	@IsEnum(Difficulty)
	@IsNotEmpty()
	difficulty!: Difficulty;

	@IsArray()
	@ArrayMaxSize(4)
	@IsString({ each: true })
	options!: string[];

	@IsEnum(QuestionType)
	@IsNotEmpty()
	questionType!: QuestionType;

	@IsString()
	@IsNotEmpty()
	answer!: string;

	@IsString()
	@IsNotEmpty()
	explanation!: string;
}

export class SavedTestRequestDto {
	@IsString()
	@IsNotEmpty()
	testName!: string;

	@IsString()
	@IsNotEmpty()
	classId!: string;

	@IsDateString()
	@IsNotEmpty()
	startedTime!: string;

	@IsNumber()
	@IsNotEmpty()
	duration!: number;

	@IsArray()
	@IsNotEmpty()
	questions!: QuestionDto[];

	@IsBoolean()
	@IsNotEmpty()
	antiCheating!: boolean;
}
