import { OmitType } from "@nestjs/mapped-types";
import { ArrayMaxSize, IsArray } from "class-validator";
import { QuestionDto } from "../../test-generation/dtos/saved-test.req.dto";

export class UpdateQuestionReqDto extends OmitType(QuestionDto, [
	"explanation",
	"options",
] as const) {
	@IsArray()
	@ArrayMaxSize(4)
	options?: {
		id: string;
		answer: string;
	}[];
}
