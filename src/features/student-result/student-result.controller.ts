import { Controller, Get, Param } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { plainToInstance } from "class-transformer";
import { IsUUID } from "class-validator";
import { I18n, I18nContext } from "nestjs-i18n";
import { Auth } from "../../shared/decorators/auth.decorator";
import { User } from "../../shared/decorators/user.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import { UserRole } from "../../shared/types/user-role.enum";
import type { AccessJwtPayload } from "../auth/auth.type";
import {
	QuestionDetailResponse,
	StudentResultResponse,
} from "./dtos/student-result-res.dto";
import { StudentResultService } from "./student-result.service";

class UuidParam {
	@IsUUID()
	id!: string;
}

class QuestionDetailParam extends UuidParam {
	@IsUUID()
	questionId!: string;
}

@ApiBearerAuth()
@Controller({ path: "student-results", version: "1" })
export class StudentResultController {
	constructor(private readonly studentResultService: StudentResultService) {}

	@Get(":id")
	@Auth(UserRole.STUDENT, UserRole.TEACHER)
	async getTestResultInfo(
		@I18n() i18n: I18nContext,
		@Param() params: UuidParam,
		@User() user: AccessJwtPayload,
	) {
		const data = await this.studentResultService.getTestResultInfo(
			params.id,
			user,
		);
		return BaseResponse.ok(
			plainToInstance(StudentResultResponse, data, {
				excludeExtraneousValues: true,
			}),
			i18n.t("student-result.GET_RESULT_INFO_SUCCESS"),
		);
	}

	@Get(":id/questions/:questionId")
	@Auth(UserRole.STUDENT, UserRole.TEACHER)
	async getQuestionDetail(
		@I18n() i18n: I18nContext,
		@Param() params: QuestionDetailParam,
		@User() user: AccessJwtPayload,
	) {
		const data = await this.studentResultService.getQuestionDetail(
			params.id,
			params.questionId,
			user,
		);
		return BaseResponse.ok(
			plainToInstance(QuestionDetailResponse, data, {
				excludeExtraneousValues: true,
			}),
			i18n.t("student-result.GET_QUESTION_DETAIL_SUCCESS"),
		);
	}
}
