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
import { I18n, I18nContext } from "nestjs-i18n";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UpdateRoleRequestDto } from "./dtos/update-role.req.dto";
import { UserResponseDto } from "./dtos/user-res.dto";
import { UserService } from "./user.service";

@Controller({ path: "users", version: "1" })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UserController {
	constructor(private readonly userService: UserService) {}
	@Get("/me")
	@HttpCode(200)
	async getCurrentUserProfile(@Req() req, @I18n() i18n: I18nContext) {
		const userInfo: UserResponseDto = await this.userService.findUserById(
			req.user.sub,
		);
		return BaseResponse.ok(userInfo, i18n.t("user.GET_PROFILE_SUCCESS"));
	}

	@Patch("/role")
	@HttpCode(200)
	async setupUserRole(
		@Req() req,
		@Body() updateRoleDto: UpdateRoleRequestDto,
		@I18n() i18n: I18nContext,
	) {
		const tokenResponse = await this.userService.updateUserRole(
			req.user.sub,
			updateRoleDto.role,
		);
		return BaseResponse.ok(tokenResponse, i18n.t("user.SETUP_ROLE_SUCCESS"));
	}
}
