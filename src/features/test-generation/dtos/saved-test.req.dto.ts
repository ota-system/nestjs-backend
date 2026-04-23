import {
	ArrayMaxSize,
	IsArray,
	IsBoolean,
	IsDate,
	IsNotEmpty,
	IsNumber,
	IsString,
} from "class-validator";
import type {
	Difficulty,
	QuestionType,
} from "../../../shared/interface/QuestionObject";

class QuestionDto {
	@IsString()
	@IsNotEmpty()
	id!: string;

	@IsString()
	@IsNotEmpty()
	question!: string;

	@IsString()
	@IsNotEmpty()
	topic!: string;

	@IsString()
	@IsNotEmpty()
	difficulty!: Difficulty;

	@IsArray()
	@ArrayMaxSize(4)
	options!: string[];

	@IsString()
	@IsNotEmpty()
	question_type!: QuestionType;

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

	@IsDate()
	@IsNotEmpty()
	startedTime!: Date;

	@IsNumber()
	@IsNotEmpty()
	duration!: number;

	@IsString()
	@IsNotEmpty()
	questions!: QuestionDto[];

	@IsBoolean()
	@IsNotEmpty()
	antiCheating!: boolean;
}
