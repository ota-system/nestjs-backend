import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { I18n, I18nContext } from "nestjs-i18n";
import { Auth } from "../../shared/decorators/auth.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import { PageParams } from "../../shared/types/page-param.type";
import { UserRole } from "../../shared/types/user-role.enum";
import { ClassAnalyticsItemDto } from "./dtos/class-analytics-res.dto";
import { OverallResultResponseDto } from "./dtos/overall-results-res.dto";
import { TestResultResponseDto } from "./dtos/test-result-res.dto";
import { CurrentStudent } from "./guards/current-student.guard";
import { StudentService } from "./student.service";

@Controller({ path: "students", version: "1" })
export class StudentController {
	constructor(private readonly studentService: StudentService) {}

	@Get(":studentId/student-results")
	@UseGuards(CurrentStudent)
	@Auth(UserRole.STUDENT)
	async getTestResultListByStudentId(
		@Param("studentId") studentId: string,
		@I18n() i18n: I18nContext,
		@Query() pagination: PageParams,
	) {
		const { data, metadata } = await this.studentService.getStudentResults(
			studentId,
			pagination,
		);
		return BaseResponse.ok(
			plainToInstance(TestResultResponseDto, data, {
				excludeExtraneousValues: true,
			}),
			i18n.t("student-result.GET_RESULT_LIST_SUCCESS"),
			metadata,
		);
	}

	@Get(":studentId/overall-results")
	@UseGuards(CurrentStudent)
	@Auth(UserRole.STUDENT)
	async getOverallTestResultByStudentId(
		@Param("studentId") studentId: string,
		@I18n() i18n: I18nContext,
	) {
		const data = await this.studentService.getOverallTestResult(studentId);
		return BaseResponse.ok(
			plainToInstance(OverallResultResponseDto, data, {
				excludeExtraneousValues: true,
			}),
			i18n.t("student-result.GET_OVERALL_RESULT_SUCCESS"),
		);
	}

	@Get(":studentId/class-analytics")
	@UseGuards(CurrentStudent)
	@Auth(UserRole.STUDENT)
	async getClassAnalytics(
		@Param("studentId") studentId: string,
		@Query("classId") classId: string,
		@I18n() i18n: I18nContext,
	) {
		const data = await this.studentService.getClassAnalytics(
			studentId,
			classId,
		);
		return BaseResponse.ok(
			plainToInstance(ClassAnalyticsItemDto, data, {
				excludeExtraneousValues: true,
			}),
			i18n.t("student-result.GET_RESULT_LIST_SUCCESS"),
		);
	}
}
