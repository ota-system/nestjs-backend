import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ENV_KEY } from "../../../shared/constants/env.constant";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private configService: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: ENV_KEY.JWT_SECRET(configService),
		});
	}

	async validate(payload: any) {
		return { userId: payload.sub, email: payload.email, role: payload.role };
	}
}
