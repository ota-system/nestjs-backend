import { OmitType } from "@nestjs/mapped-types";
import { SavedTestRequestDto } from "../../test-generation/dtos/saved-test.req.dto";

export class UpdateTestInfoReqDto extends OmitType(SavedTestRequestDto, [
	"questions",
	"classId",
] as const) {}
