import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignUpDto } from "./dto/sign-up.dto";
import { SignUpResDto } from "./dto/sign-up-res.dto";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("signup")
	async signUp(
		@Body() signUpDto: SignUpDto,
	): Promise<{ result: SignUpResDto }> {
		const result = await this.authService.signUpLocal(signUpDto);
		return { result };
	}

	@Get("verify")
	async verifyEmail(@Query("token") token: string) {
		const isVerified = await this.authService.verifyUserByLinkViaEmail(token);

		return {
			success: true,
			message: "Email verified successfully. You can now log in.",
		};
	}
}
