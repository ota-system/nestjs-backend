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
		const i18n = I18nContext.current();

		if (!payload.sid) {
			throw new UnauthorizedException(
				await i18n?.t("auth.INVALID_TOKEN_SESSION"),
			);
		}

		const isRevoked = await this.redisService.isAccessSessionRevoked(
			payload.sid,
		);
		if (isRevoked) {
			throw new UnauthorizedException(
				await i18n?.t("auth.ACCESS_TOKEN_REVOKED"),
			);
		}

		return payload;
	}
}
