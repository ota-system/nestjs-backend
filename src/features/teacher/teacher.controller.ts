import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { plainToInstance } from "class-transformer";
import { I18n, I18nContext } from "nestjs-i18n";
import { Auth } from "../../shared/decorators/auth.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import { UserRole } from "../../shared/types/user-role.enum";
import { OverviewInfoRequestDto } from "./dtos/overview-info-req.dto";
import { CurrentTeacherGuard } from "./guards/current-teacher.guard";
import { TeacherService } from "./teacher.service";

@Controller({ path: "teachers", version: "1" })
export class TeacherController {
	constructor(private readonly teacherService: TeacherService) {}

	@Get(":teacherId/overview")
	@UseGuards(CurrentTeacherGuard)
	@Auth(UserRole.TEACHER)
	@ApiBearerAuth()
	async getOverviewInfo(
		@Param("teacherId") teacherId: string,
		@I18n() i18n: I18nContext,
	) {
		const data = await this.teacherService.getOverViewInfo(teacherId);
		return BaseResponse.ok(
			plainToInstance(OverviewInfoRequestDto, data, {
				excludeExtraneousValues: true,
			}),
			i18n.t("teacher.GET_OVERVIEW_INFO_SUCCESS"),
		);
	}
}
