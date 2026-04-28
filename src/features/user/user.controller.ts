import { Body, Controller, Get, HttpCode, Patch } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";
import { Auth } from "../../shared/decorators/auth.decorator";
import { User } from "../../shared/decorators/user.decorator";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import type { JwtPayload } from "../../shared/types/jwt-payload.type";
import { UpdateRoleRequestDto } from "./dtos/update-role.req.dto";
import { UserResponseDto } from "./dtos/user-res.dto";
import { UserService } from "./user.service";

@Controller({ path: "users", version: "1" })
@ApiBearerAuth()
@Auth()
export class UserController {
	constructor(private readonly userService: UserService) {}
	@Get("/me")
	@HttpCode(200)
	async getCurrentUserProfile(
		@User() user: JwtPayload,
		@I18n() i18n: I18nContext,
	) {
		const userInfo: UserResponseDto = await this.userService.findUserById(
			user.sub,
		);
		return BaseResponse.ok(userInfo, i18n.t("user.GET_PROFILE_SUCCESS"));
	}

	@Patch("/role")
	@HttpCode(200)
	async setupUserRole(
		@User() user: JwtPayload,
		@Body() updateRoleDto: UpdateRoleRequestDto,
		@I18n() i18n: I18nContext,
	) {
		const tokenResponse = await this.userService.updateUserRole(
			user.sub,
			updateRoleDto.role,
		);
		return BaseResponse.ok(tokenResponse, i18n.t("user.SETUP_ROLE_SUCCESS"));
	}
}
