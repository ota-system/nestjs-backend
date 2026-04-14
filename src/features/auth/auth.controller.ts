import { Body, Controller, Post } from "@nestjs/common";
import type { AuthService } from "./auth.service";
import type { SignUpDto } from "./dto/sign-up.dto";
import type { UserEntity } from "./entities/user.entity";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("signup")
	async signUp(@Body() signUpDto: SignUpDto): Promise<{ user: UserEntity }> {
		const user = await this.authService.signUpLocal(signUpDto);
		return { user };
	}
}
