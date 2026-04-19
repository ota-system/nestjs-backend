import { ConfigService } from "@nestjs/config";

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

	REDIS_HOST: (config: ConfigService) =>
		config.get<string>("REDIS_HOST", "localhost"),

	REDIS_PORT: (config: ConfigService) => config.get<number>("REDIS_PORT", 6379),

	REDIS_PASSWORD: (config: ConfigService) =>
		config.get<string>("REDIS_PASSWORD", "secure-pwd"),

	MAIL_HOST: (config: ConfigService) =>
		config.get<string>("MAIL_HOST", "smtp.gmail.com"),

	MAIL_USER: (config: ConfigService) => config.get<string>("MAIL_USER", ""),

	MAIL_PASS: (config: ConfigService) => config.get<string>("MAIL_PASS", ""),

	MAIL_FROM: (config: ConfigService) =>
		config.get<string>("MAIL_FROM", '"No Reply" <noreply@example.com>'),

	FRONTEND_URL: (config: ConfigService) =>
		config.get<string>("FRONTEND_URL", "http://localhost:5173"),

	JWT_SECRET: (config: ConfigService) =>
		config.get<string>("JWT_SECRET", "super-secret-change-in-prod"),

	JWT_ACCESS_EXPIRES: (config: ConfigService) =>
		config.get<string>("JWT_ACCESS_EXPIRES", "15m"),

	JWT_REFRESH_EXPIRES: (config: ConfigService) =>
		config.get<string>("JWT_REFRESH_EXPIRES", "7d"),

	JWT_REFRESH_EXPIRES_SECONDS: (config: ConfigService) =>
		config.get<number>("JWT_REFRESH_EXPIRES_SECONDS", 7 * 24 * 60 * 60), // 7 days in seconds

	CORS_ORIGINS: (config: ConfigService) =>
		config.get<string>("CORS_ORIGINS", "http://localhost:5173"),

	GOOGLE_CLIENT_ID: (config: ConfigService) =>
		config.get<string>("GOOGLE_CLIENT_ID", ""),

	GOOGLE_CLIENT_SECRET: (config: ConfigService) =>
		config.get<string>("GOOGLE_CLIENT_SECRET", ""),
};
