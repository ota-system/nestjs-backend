import { ConfigService } from "@nestjs/config";
import type { JwtModuleOptions } from "@nestjs/jwt";
import { ENV_KEY } from "../constants/env.constant";

export const getJwtConfig = (
	configService: ConfigService,
): JwtModuleOptions => ({
	secret: configService.get<string>(
		"JWT_SECRET",
		"super-secret-change-in-prod",
	),
	signOptions: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expiresIn: ENV_KEY.JWT_ACCESS_EXPIRES(configService) as any,
	},
});
