import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { I18nContext } from "nestjs-i18n";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ENV_KEY } from "../../../shared/constants/env.constant";
import { RedisService } from "../../../shared/redis/redis.service";
import type { AccessJwtPayload } from "../auth.type";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly configService: ConfigService,
		private readonly redisService: RedisService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: ENV_KEY.JWT_SECRET(configService),
		});
	}

	async validate(payload: AccessJwtPayload): Promise<AccessJwtPayload> {
		if (!payload.sid) {
			throw new UnauthorizedException(
				await this.translateAuthMessage(
					"INVALID_TOKEN_SESSION",
					"Invalid token or session. Please sign in again.",
				),
			);
		}

		const isRevoked = await this.redisService.isAccessSessionRevoked(
			payload.sid,
		);
		if (isRevoked) {
			throw new UnauthorizedException(
				await this.translateAuthMessage(
					"ACCESS_TOKEN_REVOKED",
					"Access token has been revoked. Please sign in again.",
				),
			);
		}

		return payload;
	}

	private async translateAuthMessage(
		key: string,
		fallback: string,
	): Promise<string> {
		const i18n = I18nContext.current();
		if (!i18n) {
			return fallback;
		}

		try {
			const message = await i18n.t(`auth.${key}`);
			return typeof message === "string" && message.length > 0
				? message
				: fallback;
		} catch {
			return fallback;
		}
	}
}
