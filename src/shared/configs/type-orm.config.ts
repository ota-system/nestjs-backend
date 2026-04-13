import type { ConfigService } from "@nestjs/config";
import type { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ENV_KEY } from "../constants/env.constant";

export const getTypeOrmConfig = (
	config: ConfigService,
): TypeOrmModuleOptions => ({
	type: "postgres",
	host: ENV_KEY.DB_HOST(config),
	port: ENV_KEY.DB_PORT(config),
	username: ENV_KEY.DB_USERNAME(config),
	password: ENV_KEY.DB_PASSWORD(config),
	database: ENV_KEY.DB_DATABASE(config),
	autoLoadEntities: true,
	synchronize: false,
});
