import {
	Body,
	Controller,
	FileTypeValidator,
	MaxFileSizeValidator,
	MessageEvent,
	ParseFilePipe,
	Post,
	Query,
	Res,
	Sse,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import type { Response } from "express";
import { I18n, I18nContext } from "nestjs-i18n";
import { Observable } from "rxjs";
import { Auth } from "../../shared/decorators/auth.decorator";
import { User } from "../../shared/decorators/user.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import { BaseException } from "../../shared/exception/base.exception";
import { OpenRouterService } from "../../shared/infras/openRouter.service";
import type { JwtPayload } from "../../shared/types/jwt-payload.type";
import { UserRole } from "../../shared/types/user-role.enum";
import { SseHelper } from "../../shared/utils/sse.helper";
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

	@Post("generate-stream-pdf")
	@ApiConsumes("multipart/form-data")
	@UseInterceptors(FileInterceptor("file"))
	async streamTestGenerationFromPdf(
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new MaxFileSizeValidator({
						maxSize: 20 * 1024 * 1024,
						message: "FILE_TOO_LARGE",
					}),
					new FileTypeValidator({
						fileType: "application/pdf",
					}),
				],
				errorHttpStatusCode: 400,
			}),
		)
		file: Express.Multer.File,
		@Body() dto: TeacherPromptRequestDto,
		@Res() res: Response,
		@I18n() i18n: I18nContext,
	) {
		try {
			const pdfText = await this.testGenerationService.extractTextFromPdf(
				file.buffer,
			);
			const combinedPrompt = `Nội dung tài liệu:\n${pdfText}\n\nYêu cầu người dùng: ${dto.prompt}`;

			const stream$ =
				this.openRouterService.generateFromTeacherPromptStream(combinedPrompt);

			SseHelper.streamObservable(res, stream$);
		} catch (error) {
			const status = error instanceof BaseException ? error.status : 500;
			const code =
				error instanceof BaseException ? error.code : "INTERNAL_ERROR";
			const message = await i18n.t(`errors.${code}`);
			SseHelper.sendError(res, status, message);
		}
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
