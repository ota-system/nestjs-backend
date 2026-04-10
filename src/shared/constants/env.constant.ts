import { ConfigService } from "@nestjs/config";

export const ENV_KEY = {
    DB_HOST: (config: ConfigService) =>
        config.getOrThrow<string>('DB_HOST', 'localhost'),

    DB_PORT: (config: ConfigService) =>
        config.getOrThrow<number>('DB_PORT', 5432),

    DB_USERNAME: (config: ConfigService) =>
        config.getOrThrow<string>('DB_USERNAME', 'postgres'),

    DB_PASSWORD: (config: ConfigService) =>
        config.getOrThrow<string>('DB_PASSWORD', 'root'),

    DB_DATABASE: (config: ConfigService) =>
        config.getOrThrow<string>('DB_DATABASE', 'ota'),

    IS_PROD: (config: ConfigService) =>
        config.getOrThrow<boolean>('IS_PROD', false),
}