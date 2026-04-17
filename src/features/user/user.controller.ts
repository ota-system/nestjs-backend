import {
	Body,
	Controller,
	Get,
	HttpCode,
	Patch,
	Req,
	UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UpdateRoleRequest } from "./dtos/update-role.req.dto";
import { UserResponseDto } from "./dtos/user-res.dto";
import { UserService } from "./user.service";

@Controller({ path: "users", version: "1" })
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get("/current-profile")
	@HttpCode(200)
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	async getCurrentUserProfile(@Req() req) {
		const userInfo: UserResponseDto = await this.userService.findUserById(
			req.user.sub,
		);
		return BaseResponse.ok(
			userInfo,
			"Truy xuất thông tin người dùng thành công",
		);
	}

	@Patch("/setup-role")
	@HttpCode(200)
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	async setupUserRole(@Req() req, @Body() updateRoleDto: UpdateRoleRequest) {
		const tokenResponse = await this.userService.updateUserRole(
			req.user.sub,
			updateRoleDto.role,
		);
		return BaseResponse.ok(tokenResponse, "Cập nhật role thành công");
	}
}
