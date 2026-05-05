import { Controller, Get, Param } from "@nestjs/common";
import { I18n, I18nContext } from "nestjs-i18n";
import { Auth } from "../../shared/decorators/auth.decorator";
import { User } from "../../shared/decorators/user.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import { AccessForbiddenException } from "../../shared/exception/access-forbidden.exception";
import { UserRole } from "../../shared/types/user-role.enum";
import type { AccessJwtPayload } from "../auth/auth.type";
import { StudentService } from "./student.service";

@Controller({ path: "students", version: "1" })
export class StudentController {
	constructor(private readonly studentService: StudentService) {}

	@Get(":studentId/student-results")
	@Auth(UserRole.STUDENT, UserRole.TEACHER)
	async getTestResultListByStudentId(
		@User() user: AccessJwtPayload,
		@Param("studentId") studentId: string,
		@I18n() i18n: I18nContext,
	) {
		if (user.role === UserRole.STUDENT && user.sub !== studentId) {
			throw new AccessForbiddenException();
		}
		const results = await this.studentService.getStudentResults(studentId);
		return BaseResponse.ok(results, i18n.t("student.GET_RESULT_LIST_SUCCESS"));
	}

	@Get(":studentId/overall-results")
	@Auth(UserRole.STUDENT, UserRole.TEACHER)
	async getOverallTestResultByStudentId(
		@User() user: AccessJwtPayload,
		@Param("studentId") studentId: string,
		@I18n() i18n: I18nContext,
	) {
		if (user.role === UserRole.STUDENT && user.sub !== studentId) {
			throw new AccessForbiddenException();
		}
		const results = await this.studentService.getOverallTestResult(studentId);
		return BaseResponse.ok(
			results,
			i18n.t("student.GET_OVERALL_RESULT_SUCCESS"),
		);
	}
}
