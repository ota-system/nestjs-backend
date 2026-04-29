import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";
import { Auth } from "../../shared/decorators/auth.decorator";
import { User } from "../../shared/decorators/user.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import type { JwtPayload } from "../../shared/types/jwt-payload.type";
import { UserRole } from "../../shared/types/user-role.enum";
import { SubmitTestRequestDto } from "./dtos/submit-test.req.dto";
import { SubmitTestResponseDto } from "./dtos/submit-test.res.dto";
import { TestService } from "./test.service";

@Controller("tests")
export class TestController {
	constructor(private readonly testService: TestService) {}

	@Post("/submit")
	@Auth(UserRole.STUDENT)
	@ApiBearerAuth()
	async submit(
		@Body() dto: SubmitTestRequestDto,
		@User() user: JwtPayload,
		@I18n() i18n: I18nContext,
	): Promise<BaseResponse<SubmitTestResponseDto>> {
		const result = await this.testService.submitTest({
			dto,
			studentId: user.sub,
		});
		return BaseResponse.ok(result, await i18n.t("test.SUBMIT_TEST_SUCCESS"));
	}

	@Get("/class/:classId")
	@Auth(UserRole.STUDENT)
	@ApiBearerAuth()
	async getExamsByClass(
		@Param("classId") classId: string,
		@User() user: JwtPayload,
		@I18n() i18n: I18nContext,
	) {
		const exams = await this.testService.getExamsByClass({
			classId,
			studentId: user.sub,
		});
		return BaseResponse.ok(exams, await i18n.t("test.GET_EXAM_LIST_SUCCESS"));
	}

	@Get("/:examId")
	@Auth(UserRole.STUDENT)
	@ApiBearerAuth()
	async getExamDetail(
		@Param("examId") examId: string,
		@User() user: JwtPayload,
		@I18n() i18n: I18nContext,
	) {
		const exam = await this.testService.getExamDetail({
			examId,
			studentId: user.sub,
		});
		return BaseResponse.ok(exam, await i18n.t("test.GET_EXAM_DETAIL_SUCCESS"));
	}
}
