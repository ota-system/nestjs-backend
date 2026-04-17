import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";
import { ENV_KEY } from "../../shared/constants/env.constant";

@Injectable()
export class GoogleAuthService {
	private client: OAuth2Client;

	constructor(private readonly configService: ConfigService) {
		this.client = new OAuth2Client(
			ENV_KEY.GOOGLE_CLIENT_ID(this.configService),
			ENV_KEY.GOOGLE_CLIENT_SECRET(this.configService),
			"postmessage",
		);
	}

	async verifyAuthCode(authCode: string) {
		try {
			const { tokens } = await this.client.getToken({
				code: authCode,
			});

			if (!tokens.id_token) {
				throw new UnauthorizedException("Không nhận được ID token từ Google");
			}

			const ticket = await this.client.verifyIdToken({
				idToken: tokens.id_token,
				audience: ENV_KEY.GOOGLE_CLIENT_ID(this.configService),
			});

			const payload = ticket.getPayload();

			if (!payload || !payload.sub || !payload.email) {
				throw new UnauthorizedException("Dữ liệu token không hợp lệ");
			}

			if (!payload.email_verified) {
				throw new UnauthorizedException("Email chưa được xác minh");
			}

			return {
				googleId: payload.sub,
				email: payload.email,
				name: payload.name,
				avatar: payload.picture,
			};
		} catch (error) {
			Logger.error("Lỗi xác thực Google:", error);
			throw new UnauthorizedException("Mã xác thực Google không hợp lệ");
		}
	}
}
