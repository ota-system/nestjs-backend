import { Body, Controller, Post } from "@nestjs/common";
import { I18n, I18nContext } from "nestjs-i18n";
import { User } from "../../shared/decorators/user.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import type { JwtPayload } from "../../shared/types/jwt-payload.type";
import { SubmitTestRequestDto } from "./dtos/submit-test.req.dto";
import { TestExamService } from "./test-exam.service";

@Controller("tests")
export class TestExamController {
	constructor(private readonly examService: TestExamService) {}

	@Post("/submit")
	async submit(
		@Body() dto: SubmitTestRequestDto,
		@User() user: JwtPayload,
		@I18n() i18n: I18nContext,
	) {
		const result = await this.examService.submitTest({
			dto,
			studentId: user.sub,
		});
		return BaseResponse.ok(result, await i18n.t("test.SUBMIT_TEST_SUCCESS"));
	}
}
