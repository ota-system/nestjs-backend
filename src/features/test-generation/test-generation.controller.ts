import {
	Body,
	Controller,
	MessageEvent,
	Post,
	Query,
	Sse,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";
import { Observable } from "rxjs";
import { Auth } from "../../shared/decorators/auth.decorator";
import { User } from "../../shared/decorators/user.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import { BaseException } from "../../shared/exception/base.exception";
import { OpenRouterService } from "../../shared/infras/openRouter.service";
import type { JwtPayload } from "../../shared/types/jwt-payload.type";
import { UserRole } from "../../shared/types/user-role.enum";
import { SavedTestRequestDto } from "./dtos/saved-test.req.dto";
import { TeacherPromptRequestDto } from "./dtos/teacher-prompt.req.dto";
import { TestGenerationService } from "./test-generation.service";

@Controller({ path: "english-tests", version: "1" })
@Auth(UserRole.TEACHER)
@ApiBearerAuth()
export class TestGenerationController {
	constructor(
		private readonly openRouterService: OpenRouterService,
		private readonly testGenerationService: TestGenerationService,
	) {}

	@Sse("generate-stream")
	streamTestGeneration(
		@Query() dto: TeacherPromptRequestDto,
	): Observable<MessageEvent> {
		return this.openRouterService.generateFromTeacherPromptStream(dto.prompt);
	}

	@Post("")
	async saveTest(
		@Body() dto: SavedTestRequestDto,
		@I18n() i18n: I18nContext,
		@User() user: JwtPayload,
	) {
		const hasPermission =
			await this.testGenerationService.checkTeacherPermission(
				dto.classId,
				user.sub,
			);
		if (!hasPermission) {
			throw new BaseException(403, "SAVE_TEST_PERMISSION_DENIED");
		}

		const result = await this.testGenerationService.saveAIGeneratedTest({
			...dto,
		});
		if (!result) {
			return;
		}
		return BaseResponse.ok([], await i18n.t("test.SAVE_TEST_SUCCESS"));
	}
}
