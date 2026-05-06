import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { I18n, I18nContext } from "nestjs-i18n";
import { Auth } from "../../shared/decorators/auth.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import { UserRole } from "../../shared/types/user-role.enum";
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
	) {
		const results = await this.studentService.getStudentResults(studentId);
		return BaseResponse.ok(results, i18n.t("student.GET_RESULT_LIST_SUCCESS"));
	}

	@Get(":studentId/overall-results")
	@UseGuards(CurrentStudent)
	@Auth(UserRole.STUDENT)
	async getOverallTestResultByStudentId(
		@Param("studentId") studentId: string,
		@I18n() i18n: I18nContext,
	) {
		const results = await this.studentService.getOverallTestResult(studentId);
		return BaseResponse.ok(
			results,
			i18n.t("student.GET_OVERALL_RESULT_SUCCESS"),
		);
	}
}
