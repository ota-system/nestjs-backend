import {
	Body,
	Controller,
	MessageEvent,
	Post,
	Query,
	Sse,
	UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";
import { Observable } from "rxjs";
import { Roles } from "../../shared/decorators/roles.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import { OpenRouterService } from "../../shared/infras/openRouter.service";
import { UserRole } from "../../shared/types/user-role.enum";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/role.guard";
import { SavedTestRequestDto } from "./dtos/saved-test.req.dto";
import { TeacherPromptRequestDto } from "./dtos/teacher-prompt.req.dto";
import { TestGenerationService } from "./test-generation.service";

@Controller({ path: "english-tests", version: "1" })
export class TestGenerationController {
	constructor(
		private readonly openRouterService: OpenRouterService,
		private readonly testGenerationService: TestGenerationService,
	) {}

	@Sse("generate-stream")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@ApiBearerAuth()
	@Roles(UserRole.TEACHER)
	streamTestGeneration(
		@Query() dto: TeacherPromptRequestDto,
	): Observable<MessageEvent> {
		return this.openRouterService.generateFromTeacherPromptStream(dto.prompt);
	}

	@Post("")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@ApiBearerAuth()
	@Roles(UserRole.TEACHER)
	async saveTest(@Body() dto: SavedTestRequestDto, @I18n() i18n: I18nContext) {
		const result = await this.testGenerationService.saveAIGeneratedTest(dto);
		if (!result) {
			return;
		}
		return BaseResponse.ok([], await i18n.t("test.SAVE_TEST_SUCCESS"));
	}
}
