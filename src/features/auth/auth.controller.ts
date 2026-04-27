import {
	Body,
	Controller,
	HttpCode,
	Post,
	Req,
	UseGuards,
} from "@nestjs/common";
import { I18n, I18nContext } from "nestjs-i18n";
import { BaseResponse } from "../../shared/dtos/base-response.dto";
import { AuthService } from "./auth.service";
import type { JwtRequest } from "./auth.type";
import type { AuthTokensResDto } from "./dto/auth-tokens-res.dto";
import { SignInRequestDto } from "./dto/sign-in-req.dto";
import { SignOutDto } from "./dto/sign-out.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import type { SignUpResDto } from "./dto/sign-up-res.dto";
import { VerifyTokenDto } from "./dto/verify-token.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { GoogleAuthService } from "./infras/google-auth.service";

@Controller({ path: "auth", version: "1" })
export class AuthController {
	constructor(
		private readonly googleAuthService: GoogleAuthService,
		private readonly authService: AuthService,
	) {}

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
	@HttpCode(200)
	async verifyToken(
		@Body() dto: VerifyTokenDto,
		@I18n() i18n: I18nContext,
	): Promise<BaseResponse<AuthTokensResDto>> {
		const tokens = await this.authService.verifyTokenAndLogin(dto.token);
		return BaseResponse.ok(tokens, await i18n.t("auth.VERIFY_EMAIL_SUCCESS"));
	}

	@Post("login")
	@HttpCode(200)
	async login(@Body() dto: SignInRequestDto, @I18n() i18n: I18nContext) {
		const tokens = await this.authService.loginLocal(dto.email, dto.password);
		return BaseResponse.ok(tokens, await i18n.t("auth.LOGIN_SUCCESS"));
	}

	@Post("google")
	@HttpCode(200)
	async googleLogin(
		@Body("authCode") authCode: string,
		@I18n() i18n: I18nContext,
	) {
		const user = await this.googleAuthService.verifyAuthCode(authCode);
		const tokens = await this.authService.loginGoogle(
			user.googleId || "",
			user.email || "",
			user.name || "",
			user.avatar,
		);
		return BaseResponse.ok(tokens, await i18n.t("auth.GOOGLE_LOGIN_SUCCESS"));
	}

	@Post("sign-out")
	@UseGuards(JwtAuthGuard)
	@HttpCode(200)
	async signOut(
		@Req() req: JwtRequest,
		@Body() dto: SignOutDto,
		@I18n() i18n: I18nContext,
	): Promise<BaseResponse<null>> {
		await this.authService.signout(
			req.user.sub,
			req.user.sid,
			req.user.exp,
			dto.refreshToken,
		);
		return BaseResponse.ok(null, await i18n.t("auth.SIGN_OUT_SUCCESS"));
	}
}
