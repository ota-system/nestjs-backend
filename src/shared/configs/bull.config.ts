import type { ConfigService } from "@nestjs/config";
import { ENV_KEY } from "../constants/env.constant";

export const getBullConfig = (configService: ConfigService) => ({
	connection: {
		host: ENV_KEY.REDIS_HOST(configService),
		port: ENV_KEY.REDIS_PORT(configService),
		password: ENV_KEY.REDIS_PASSWORD(configService),
	},
});
