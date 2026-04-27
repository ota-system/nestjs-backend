import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ENV_KEY } from "../../../shared/constants/env.constant";
import { BaseException } from "../../../shared/exception/base.exception";
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
			throw new BaseException(401, "INVALID_TOKEN_SESSION");
		}

		const isRevoked = await this.redisService.isAccessSessionRevoked(
			payload.sid,
		);
		if (isRevoked) {
			throw new BaseException(401, "ACCESS_TOKEN_REVOKED");
		}

		return payload;
	}
}
