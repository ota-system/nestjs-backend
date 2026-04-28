import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";
import { ENV_KEY } from "../../../shared/constants/env.constant";
import { BaseException } from "../../../shared/exception/base.exception";

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
				throw new BaseException(401, "GOOGLE_ID_TOKEN_MISSING");
			}

			const ticket = await this.client.verifyIdToken({
				idToken: tokens.id_token,
				audience: ENV_KEY.GOOGLE_CLIENT_ID(this.configService),
			});

			const payload = ticket.getPayload();

			if (!payload || !payload.sub || !payload.email) {
				throw new BaseException(401, "GOOGLE_TOKEN_INVALID_DATA");
			}

			if (!payload.email_verified) {
				throw new BaseException(401, "GOOGLE_EMAIL_NOT_VERIFIED");
			}

			return {
				googleId: payload.sub,
				email: payload.email,
				name: payload.name,
				avatar: payload.picture,
			};
		} catch (error) {
			Logger.error("Lỗi xác thực Google:", error);
			throw new BaseException(401, "GOOGLE_AUTH_CODE_INVALID");
		}
	}
}
