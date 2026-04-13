import type { ConfigService } from "@nestjs/config";

export const ENV_KEY = {
	DB_HOST: (config: ConfigService) =>
		config.get<string>("DB_HOST", "localhost"),

	DB_PORT: (config: ConfigService) => config.get<number>("DB_PORT", 5432),

	DB_USERNAME: (config: ConfigService) =>
		config.get<string>("DB_USERNAME", "postgres"),

	DB_PASSWORD: (config: ConfigService) =>
		config.get<string>("DB_PASSWORD", "root"),

	DB_DATABASE: (config: ConfigService) =>
		config.get<string>("DB_DATABASE", "ota"),

	IS_PROD: (config: ConfigService) => config.get<boolean>("IS_PROD", false),
};
