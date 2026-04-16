import type { ConfigService } from "@nestjs/config";
import type { JwtModuleOptions } from "@nestjs/jwt";

export const getJwtConfig = (
	configService: ConfigService,
): JwtModuleOptions => ({
	secret: configService.get<string>(
		"JWT_SECRET",
		"super-secret-change-in-prod",
	),
	signOptions: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expiresIn: configService.get<string>("JWT_ACCESS_EXPIRES", "15m") as any,
	},
});
