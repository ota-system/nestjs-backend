import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseBoolPipe,
	Patch,
	Post,
	Query,
	UseInterceptors,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { plainToInstance } from "class-transformer";
import { I18n, I18nContext } from "nestjs-i18n";
import { Auth } from "../../shared/decorators/auth.decorator";
import { User } from "../../shared/decorators/user.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import {
	InvalidateCache,
	SmartCache,
	UniversalInvalidateCacheInterceptor,
	UniversalSmartCacheInterceptor,
} from "../../shared/interceptors/smart-cache.interceptor";
import type { JwtPayload } from "../../shared/types/jwt-payload.type";
import { PageParams } from "../../shared/types/page-param.type";
import { UserRole } from "../../shared/types/user-role.enum";
import { TestQuestionDto } from "../question/dtos/question-res.dto";
import { QuestionService } from "../question/question.service";
import { CreateTestFraudReqDto } from "./dtos/create-test-fraud.req.dto";
import { SubmitTestRequestDto } from "./dtos/submit-test.req.dto";
import { SubmitTestResponseDto } from "./dtos/submit-test.res.dto";
import { ExamResponseDto } from "./dtos/tesst-res.dto";
import { UpdateQuestionReqDto } from "./dtos/update-question.req.dto";
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
	@InvalidateCache([
		{ keyPrefix: "test_students", target: "body", targetField: "testId" },
	])
	@UseInterceptors(UniversalInvalidateCacheInterceptor)
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
		if (user.role === UserRole.STUDENT) {
			await this.testService.saveTestStartTimeOfStudent({
				studentId: user.sub,
				testId,
				startTime: test.startedTime,
			});
		}

		const response = await this.questionService.getQuestionsForTest({
			test,
			role: user.role,
			page: query.page,
			limit: query.limit,
		});

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

	@Get(":testId/summary")
	@Auth(UserRole.TEACHER)
	async getTestSummary(
		@I18n() i18n: I18nContext,
		@Param("testId") testId: string,
		@User() user: JwtPayload,
	) {
		const summary = await this.testService.getSummary(
			testId,
			user.sub,
			user.role,
		);
		return BaseResponse.ok(
			summary,
			await i18n.t("test.GET_SUMMARY_SUCCESS", {
				defaultValue: "Lấy thống kê bài thi thành công",
			}),
		);
	}

	@Get(":testId/students")
	@Auth(UserRole.TEACHER)
	@SmartCache({
		keyPrefix: "test_students",
		target: "params",
		targetField: "testId",
		ttlSeconds: 60,
	})
	@UseInterceptors(UniversalSmartCacheInterceptor)
	async getTestStudents(
		@I18n() i18n: I18nContext,
		@Param("testId") testId: string,
		@Query() query: PageParams,
		@User() user: JwtPayload,
	) {
		const result = await this.testService.getStudentTestListResult(
			testId,
			user.sub,
			user.role,
			query.page,
			query.limit,
		);
		return BaseResponse.ok(
			result.data,
			await i18n.t("test.GET_STUDENTS_SUCCESS", {
				defaultValue: "Lấy danh sách thí sinh thành công",
			}),
			result.metadata,
		);
	}

	@Post(":testId/fraud-reports")
	@Auth(UserRole.STUDENT)
	async storeTestFraudResult(
		@Param("testId") testId: string,
		@User() user: JwtPayload,
		@Body() fraud: CreateTestFraudReqDto,
		@I18n() i18n: I18nContext,
	) {
		await this.testService.storeTestFraudResult(
			testId,
			user.sub,
			user.role,
			fraud.fraudType,
		);
		if (fraud.fraudType === FraudType.VISIBILITY_CHANGE) {
			return BaseResponse.ok(
				null,
				await i18n.t("test.WINDOW_VISIBILITY_CHANGED"),
			);
		}

		return BaseResponse.ok(null, await i18n.t("test.FULLSCREEN_EXIT_DETECTED"));
	}

	@Patch(":testId/questions/:questionId")
	@Auth(UserRole.TEACHER)
	async updateQuestion(
		@Param("testId") testId: string,
		@Param("questionId") questionId: string,
		@User() user: JwtPayload,
		@Body() question: UpdateQuestionReqDto,
		@I18n() i18n: I18nContext,
	) {
		const test = await this.testService.getTestInfo(
			testId,
			user.sub,
			user.role,
		);

		const updatedQuestion = await this.questionService.updateQuestion(
			questionId,
			question,
		);

		return BaseResponse.ok(
			plainToInstance(TestQuestionDto, updatedQuestion, {
				excludeExtraneousValues: true,
			}),
			await i18n.t("test.UPDATE_QUESTION_SUCCESS"),
		);
	}

	@Delete(":testId/questions/:questionId")
	@Auth(UserRole.TEACHER)
	async deleteQuestion(
		@Param("testId") testId: string,
		@Param("questionId") questionId: string,
		@User() user: JwtPayload,
		@I18n() i18n: I18nContext,
	) {
		const test = await this.testService.getTestInfo(
			testId,
			user.sub,
			user.role,
		);

		await this.questionService.deleteQuestion(questionId);

		return BaseResponse.ok(null, await i18n.t("test.DELETE_QUESTION_SUCCESS"));
	}
}
