import {
	Body,
	Controller,
	Get,
	Param,
	ParseBoolPipe,
	Post,
	Query,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { plainToInstance } from "class-transformer";
import { I18n, I18nContext } from "nestjs-i18n";
import { Auth } from "../../shared/decorators/auth.decorator";
import { User } from "../../shared/decorators/user.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import type { JwtPayload } from "../../shared/types/jwt-payload.type";
import { PageParams } from "../../shared/types/page-param.type";
import { UserRole } from "../../shared/types/user-role.enum";
import { TestQuestionDto } from "../question/dtos/question-res.dto";
import { QuestionService } from "../question/question.service";
import { FraudDetectionRequestDto } from "./dtos/fraud-detection.req.dto";
import { SubmitTestRequestDto } from "./dtos/submit-test.req.dto";
import { SubmitTestResponseDto } from "./dtos/submit-test.res.dto";
import { ExamResponseDto } from "./dtos/tesst-res.dto";
import { TestService } from "./test.service";
import { FraudType } from "./type";

@ApiBearerAuth()
@Controller({ path: "tests", version: "1" })
export class TestController {
	constructor(
		private readonly testService: TestService,
		private readonly questionService: QuestionService,
	) {}

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
	@Auth(UserRole.STUDENT, UserRole.TEACHER)
	async getTestInfo(
		@I18n() i18n: I18nContext,
		@Param("testId") testId: string,
		@Query("detailed", ParseBoolPipe) detailed: boolean,
		@User() user: JwtPayload,
	) {
		if (detailed) {
			const test = await this.testService.getDetailedTestInfo({
				testId,
				studentId: user.sub,
			});
			return BaseResponse.ok(
				test,
				await i18n.t("test.GET_EXAM_DETAIL_SUCCESS"),
			);
		}
		const test = await this.testService.getTestInfo(
			testId,
			user.sub,
			user.role,
		);
		return BaseResponse.ok(
			plainToInstance(ExamResponseDto, test, { excludeExtraneousValues: true }),
			i18n.t("test.GET_EXAM_SUCCESS"),
		);
	}

	@Get(":testId/questions")
	@Auth(UserRole.TEACHER, UserRole.STUDENT)
	async getQuestionsForTest(
		@I18n() i18n: I18nContext,
		@Param("testId") testId: string,
		@Query() query: PageParams,
		@User() user: JwtPayload,
	) {
		const test = await this.testService.getTestInfo(
			testId,
			user.sub,
			user.role,
		);

		const response = await this.questionService.getQuestionsForTest(
			test,
			query.page,
			query.limit,
		);
		return BaseResponse.ok(
			plainToInstance(TestQuestionDto, response, {
				excludeExtraneousValues: true,
			}),
			i18n.t("test.GET_QUESTIONS_SUCCESS"),
			{
				page: query.page,
				limit: query.limit,
				totalPages: Math.ceil(response.totalQuestions / query.limit),
			},
		);
	}

	@Post(":testId/fraud-reports")
	@Auth(UserRole.STUDENT)
	async storeFraudDetectionResult(
		@Param("testId") testId: string,
		@User() user: JwtPayload,
		@Body() fraud: FraudDetectionRequestDto,
		@I18n() i18n: I18nContext,
	) {
		await this.testService.storeFraudDetectionResult(
			testId,
			user.sub,
			user.role,
			fraud,
		);
		if (fraud.fraudType === FraudType.VISIBILITY_CHANGE) {
			return BaseResponse.ok(
				null,
				await i18n.t("test.WINDOW_VISIBILITY_CHANGED"),
			);
		} else if (fraud.fraudType === FraudType.FULLSCREEN_EXIT) {
			return BaseResponse.ok(
				null,
				await i18n.t("test.FULLSCREEN_EXIT_DETECTED"),
			);
		}
	}
}
