import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";
import { ENV_KEY } from "../../shared/constants/env.constant";

@Injectable()
export class GoogleAuthService {
	constructor(
		private readonly configService: ConfigService,
		private client = new OAuth2Client(
			ENV_KEY.GOOGLE_CLIENT_ID(this.configService),
		),
	) {}

	async verifyToken(idToken: string) {
		try {
			const ticket = await this.client.verifyIdToken({
				idToken,
				audience: ENV_KEY.GOOGLE_CLIENT_ID(this.configService),
			});

			const payload = ticket.getPayload();

			return {
				email: payload?.email,
				name: payload?.name,
				picture: payload?.picture,
				googleId: payload?.sub,
			};
		} catch (error) {
			throw new UnauthorizedException("Invalid Google token");
		}
	}
}
