import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";
import { Roles } from "../../shared/decorators/roles.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import { UserRole } from "../auth/entities/user-role.enum";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/role.guard";
import { ClassService } from "./class.service";
import { CreateClassRequestDto } from "./dtos/create-class-req.dto";

@Controller({ path: "classes", version: "1" })
export class ClassController {
	constructor(private readonly classService: ClassService) {}

	@Post()
	@UseGuards(JwtAuthGuard, RolesGuard)
	@ApiBearerAuth()
	@Roles(UserRole.TEACHER)
	async create(
		@I18n() i18n: I18nContext,
		@Req() req: any,
		@Body() body: CreateClassRequestDto,
	) {
		const userId: string = req.user.sub;
		const classroom = await this.classService.createClass({
			name: body.name,
			subject: body.subject,
			teacherId: userId,
		});
		return BaseResponse.ok(classroom, i18n.t("class.CREATED_SUCCESS"));
	}
}
