import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Query,
	UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { plainToInstance } from "class-transformer";
import { I18n, I18nContext } from "nestjs-i18n";
import { Auth } from "../../shared/decorators/auth.decorator";
import { Roles } from "../../shared/decorators/roles.decorator";
import { User } from "../../shared/decorators/user.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import type { JwtPayload } from "../../shared/types/jwt-payload.type";
import { UserRole } from "../../shared/types/user-role.enum";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetQuestionsQueryDto } from "../question/dtos/get-questions-query.dto";
import { ExamQuestionDto } from "../question/dtos/question-res.dto";
import { QuestionService } from "../question/question.service";
import { ExamResponseDto } from "./dtos/exam-res.dto";
import { SubmitTestRequestDto } from "./dtos/submit-test.req.dto";
import { SubmitTestResponseDto } from "./dtos/submit-test.res.dto";
import { TestService } from "./test.service";

@UseGuards(JwtAuthGuard)
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
	@Roles(UserRole.TEACHER, UserRole.STUDENT)
	async getExam(
		@I18n() i18n: I18nContext,
		@Param("testId") testId: string,
		@User() user: JwtPayload,
	) {
		const exam = await this.testService.getExam(testId, user.sub, user.role);
		return BaseResponse.ok(
			plainToInstance(ExamResponseDto, exam, { excludeExtraneousValues: true }),
			i18n.t("test.GET_EXAM_SUCCESS"),
			{ totalQuestions: exam.totalQuestions },
		);
	}

	@Get(":testId/questions")
	@Roles(UserRole.TEACHER, UserRole.STUDENT)
	async getQuestionsForTest(
		@I18n() i18n: I18nContext,
		@Param("testId") testId: string,
		@Query() query: GetQuestionsQueryDto,
		@User() user: JwtPayload,
	) {
		const { data, total } = await this.questionService.getQuestionsForTest(
			testId,
			user.sub,
			user.role,
			query.page,
			query.limit,
		);
		return BaseResponse.ok(
			plainToInstance(ExamQuestionDto, data, { excludeExtraneousValues: true }),
			i18n.t("test.GET_QUESTIONS_SUCCESS"),
			{
				total,
				page: query.page,
				limit: query.limit,
				totalPages: Math.ceil(total / query.limit),
			},
		);
	}
}
