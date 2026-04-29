import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";
import { Auth } from "../../shared/decorators/auth.decorator";
import { Roles } from "../../shared/decorators/roles.decorator";
import { User } from "../../shared/decorators/user.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import type { JwtPayload } from "../../shared/types/jwt-payload.type";
import { UserRole } from "../../shared/types/user-role.enum";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SubmitTestRequestDto } from "./dtos/submit-test.req.dto";
import { SubmitTestResponseDto } from "./dtos/submit-test.res.dto";
import { TestService } from "./test.service";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller({ path: "tests", version: "1" })
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

	@Get(":testId")
	@Roles(UserRole.TEACHER, UserRole.STUDENT)
	async getExam(
		@I18n() i18n: I18nContext,
		@Param("testId") testId: string,
		@User() user: JwtPayload,
	) {
		const exam = await this.testService.getExam(testId, user.sub, user.role);
		return BaseResponse.ok(exam, i18n.t("test.GET_EXAM_SUCCESS"));
	}
}
