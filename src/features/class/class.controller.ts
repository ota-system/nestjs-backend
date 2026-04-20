import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Roles } from "../../shared/decorators/roles.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import { UserRole } from "../auth/entities/user-role.enum";
import { RolesGuard } from "../auth/guards/role.guard";
import { ClassService } from "./class.service";
import { CreateClassRequestDto } from "./dtos/create-class-req.dto";

@Controller({ path: "classes", version: "1" })
export class ClassController {
	constructor(private readonly classService: ClassService) {}

	@Post()
	@UseGuards(AuthGuard("jwt"), RolesGuard)
	@ApiBearerAuth()
	@Roles(UserRole.TEACHER)
	async create(@Req() req: any, @Body() body: CreateClassRequestDto) {
		const userId: string = req.user.sub;
		const classroom = await this.classService.createClass({
			name: body.name,
			subject: body.subject,
			teacherId: userId,
		});
		return BaseResponse.ok(classroom, "Tạo lớp học thành công");
	}
}
