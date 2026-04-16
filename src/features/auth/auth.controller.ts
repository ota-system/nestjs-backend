import { Body, Controller, Post } from "@nestjs/common";
import { I18n, I18nContext } from "nestjs-i18n";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import { AuthService } from "./auth.service";
import type { AuthTokensResDto } from "./dto/auth-tokens-res.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import type { SignUpResDto } from "./dto/sign-up-res.dto";
import { VerifyTokenDto } from "./dto/verify-token.dto";

@Controller({ path: "auth", version: "1" })
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("sign-up")
	async signUp(
		@Body() signUpDto: SignUpDto,
		@I18n() i18n: I18nContext,
	): Promise<BaseResponse<SignUpResDto>> {
		const user = await this.authService.signUpLocal(signUpDto);
		const data: SignUpResDto = {
			id: user.id,
			fullName: user.fullName,
			email: user.email,
			// biome-ignore lint/style/noNonNullAssertion: role is always set on signUpLocal
			role: user.role!,
			avatarUrl: user.avatarUrl,
			createdAt: user.createdAt,
		};
		return BaseResponse.ok(data, await i18n.t("auth.SIGN_UP_SUCCESS"));
	}

	@Post("verify-token")
	async verifyToken(
		@Body() dto: VerifyTokenDto,
		@I18n() i18n: I18nContext,
	): Promise<BaseResponse<AuthTokensResDto>> {
		const tokens = await this.authService.verifyTokenAndLogin(dto.token);
		return BaseResponse.ok(tokens, await i18n.t("auth.VERIFY_EMAIL_SUCCESS"));
	}
}
