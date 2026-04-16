import { Controller, Get, HttpCode, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UserResponseDto } from "./dtos/user-res.dto";
import { UserService } from "./user.service";

@Controller("user")
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get("/current-profile")
	@HttpCode(200)
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	async getCurrentUserProfile(@Req() req) {
		const userInfo: UserResponseDto = await this.userService.findUserById(
			req.user.userId,
		);
		return BaseResponse.ok(
			userInfo,
			"Truy xuất thông tin người dùng thành công",
		);
	}
}
