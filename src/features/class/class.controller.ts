import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { plainToInstance } from "class-transformer";
import { I18n, I18nContext } from "nestjs-i18n";
import { Roles } from "../../shared/decorators/roles.decorator";
import { User } from "../../shared/decorators/user.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import type { JwtPayload } from "../../shared/types/jwt-payload.type";
import { UserRole } from "../../shared/types/user-role.enum";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/role.guard";
import { ClassService } from "./class.service";
import { ClassResponseDto, UserSummaryDto } from "./dtos/class-res.dto";
import { CreateClassRequestDto } from "./dtos/create-class-req.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller({ path: "classes", version: "1" })
export class ClassController {
	constructor(private readonly classService: ClassService) {}

	@Post()
	@Roles(UserRole.TEACHER)
	async create(
		@I18n() i18n: I18nContext,
		@User() user: JwtPayload,
		@Body() body: CreateClassRequestDto,
	) {
		const userId: string = user.sub;
		const classroom = await this.classService.createClass({
			name: body.name,
			subject: body.subject,
			teacherId: userId,
		});
		return BaseResponse.ok(classroom, i18n.t("class.CREATED_SUCCESS"));
	}

	// Get Class list base on role (Teacher: get class created by teacher, Student: get class joined by student)
	// plainToInstance is used to transform ClassEntity to ClassResponseDto
	@Get()
	@Roles(UserRole.TEACHER, UserRole.STUDENT)
	async getClassList(@I18n() i18n: I18nContext, @User() user: JwtPayload) {
		const userId: string = user.sub;
		const role: UserRole = user.role;
		const classes = await this.classService.getClassList(userId, role);
		return BaseResponse.ok(
			plainToInstance(ClassResponseDto, classes, {
				excludeExtraneousValues: true,
			}),
			i18n.t("class.GET_CLASS_LIST_SUCCESS"),
		);
	}

	@Get(":id")
	@Roles(UserRole.TEACHER, UserRole.STUDENT)
	async getClassDetail(
		@I18n() i18n: I18nContext,
		@Param("id") id: string,
		@User() user: JwtPayload,
	) {
		const userId: string = user.sub;
		const role: UserRole = user.role;
		const classroom = await this.classService.getClassDetail(id, userId, role);
		return BaseResponse.ok(
			plainToInstance(ClassResponseDto, classroom, {
				excludeExtraneousValues: true,
			}),
			i18n.t("class.GET_CLASS_DETAIL_SUCCESS"),
		);
	}

	@Get(":id/students")
	@Roles(UserRole.TEACHER, UserRole.STUDENT)
	async getStudentsInClass(
		@I18n() i18n: I18nContext,
		@Param("id") id: string,
		@User() user: JwtPayload,
	) {
		const userId: string = user.sub;
		const role: UserRole = user.role;
		const students = await this.classService.getStudentsInClass(
			id,
			userId,
			role,
		);
		return BaseResponse.ok(
			plainToInstance(UserSummaryDto, students, {
				excludeExtraneousValues: true,
			}),
			i18n.t("class.GET_STUDENTS_SUCCESS"),
		);
	}
}
