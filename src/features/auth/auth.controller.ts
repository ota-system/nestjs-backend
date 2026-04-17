import {
	Body,
	Controller,
	Get,
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
import { LoginRequestDto } from "./dto/login-req.dto";
import { SignOutDto } from "./dto/sign-out.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import type { SignUpResDto } from "./dto/sign-up-res.dto";
import { VerifyTokenDto } from "./dto/verify-token.dto";
import { GoogleAuthService } from "./google-auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

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
	async login(@Body() dto: LoginRequestDto, @I18n() i18n: I18nContext) {
		const tokens = await this.authService.loginLocal(dto.email, dto.password);
		return BaseResponse.ok(tokens, await i18n.t("auth.LOGIN_SUCCESS"));
	}

	@Post("google")
	async googleLogin(@Body("idToken") idToken: string) {
		const user = await this.googleAuthService.verifyToken(idToken);
		const tokens = await this.authService.loginGoogle(
			user.googleId || "",
			user.email || "",
			user.name || "",
			user.picture,
		);
		return BaseResponse.ok(tokens, "Google login successful");
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

	@Get("abc")
	@UseGuards(JwtAuthGuard)
	@HttpCode(200)
	async abc(@I18n() i18n: I18nContext): Promise<BaseResponse<string>> {
		return BaseResponse.ok("ccccc", await i18n.t("auth.SIGN_OUT_SUCCESS"));
	}
}
