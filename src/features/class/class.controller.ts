import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Req,
	UseGuards,
} from "@nestjs/common";
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
		return BaseResponse.ok(
			classroom,
			i18n.t("class.CREATED_SUCCESS", {
				defaultValue: "Class created successfully",
			}),
		);
	}

	// Get Class list base on role (Teacher: get class created by teacher, Student: get class joined by student)
	@Get()
	@UseGuards(JwtAuthGuard, RolesGuard)
	@ApiBearerAuth()
	@Roles(UserRole.TEACHER, UserRole.STUDENT)
	async getClassList(@I18n() i18n: I18nContext, @Req() req: any) {
		const userId: string = req.user.sub;
		const role: UserRole = req.user.role;
		const classes = await this.classService.getClassList(userId, role);
		return BaseResponse.ok(
			classes,
			i18n.t("class.GET_LIST_SUCCESS", {
				defaultValue: "Get class list successfully",
			}),
		);
	}

	@Get(":id")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	async getClassDetail(@I18n() i18n: I18nContext, @Param("id") id: string) {
		const classroom = await this.classService.getClassDetail(id);
		return BaseResponse.ok(
			classroom,
			i18n.t("class.GET_DETAIL_SUCCESS", {
				defaultValue: "Get class detail successfully",
			}),
		);
	}
}
