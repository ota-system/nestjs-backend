import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { plainToInstance } from "class-transformer";
import { I18n, I18nContext } from "nestjs-i18n";
import { ClassEntity } from "../../database/entities/class.entity";
import { StudentClassEntity } from "../../database/entities/student-class.entity";
import { Auth } from "../../shared/decorators/auth.decorator";
import { User } from "../../shared/decorators/user.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import type { JwtPayload } from "../../shared/types/jwt-payload.type";
import { UserRole } from "../../shared/types/user-role.enum";
import { ClassService } from "./class.service";
import { ClassResponseDto, UserSummaryDto } from "./dtos/class-res.dto";
import { CreateClassRequestDto } from "./dtos/create-class-req.dto";

@ApiBearerAuth()
@Controller({ path: "classes", version: "1" })
export class ClassController {
	constructor(private readonly classService: ClassService) {}

	@Post()
	@Auth(UserRole.TEACHER)
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
	@Auth(UserRole.TEACHER, UserRole.STUDENT)
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
	@Auth(UserRole.TEACHER, UserRole.STUDENT)
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
	@Auth(UserRole.TEACHER, UserRole.STUDENT)
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

	@Post(":id/join")
	@Auth(UserRole.STUDENT)
	async joinClass(
		@I18n() i18n: I18nContext,
		@Param("id") classId: string,
		@Req() req: any,
	) {
		const userId: string = req.user.sub;
		const studentClass: StudentClassEntity =
			await this.classService.addStudentToClass(userId, classId);

		return BaseResponse.ok(
			plainToInstance(ClassResponseDto, studentClass.class),
			i18n.t("class.JOINED_CLASS_SUCCESS"),
		);
	}

	@Get("code/:code")
	@Auth(UserRole.TEACHER, UserRole.STUDENT)
	async getClassByCode(@I18n() i18n: I18nContext, @Param("code") code: string) {
		const classroom: ClassEntity = await this.classService.getClassByCode(code);
		return BaseResponse.ok(
			plainToInstance(ClassResponseDto, classroom, {
				excludeExtraneousValues: true,
			}),
			i18n.t("class.GET_CLASS_DETAIL_SUCCESS"),
		);
	}
}
