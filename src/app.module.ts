import * as path from "node:path"; // Dùng node:path cho chuẩn Biome/Node
import { RedisModule } from "@liaoliaots/nestjs-redis";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/adapters/handlebars.adapter";
import { HeaderResolver, I18nModule, QueryResolver } from "nestjs-i18n";
import { join } from "path";
import { AuthModule } from "./features/auth/auth.module";
import { UserModule } from "./features/user/user.module";
import { getTypeOrmConfig } from "./shared/configs/type-orm.config";
import { ENV_KEY } from "./shared/constants/env.constant";
import { SharedModule } from "./shared/shared.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),

		// 1. I18n Module
		I18nModule.forRootAsync({
			useFactory: (configService: ConfigService) => ({
				fallbackLanguage: "vi",
				loaderOptions: {
					path: path.join(process.cwd(), "dist/i18n/"),
					watch: true,
				},
			}),
			resolvers: [
				new QueryResolver(["lang", "l"]), //1st priority: check query parameters
				new HeaderResolver(["x-lang"]), //2nd priority: check custom header
			],
			inject: [ConfigService],
		}),

		// 2. Database Module
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getTypeOrmConfig,
		}),

		// 3. Redis Module
		RedisModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: any) => ({
				config: {
					host: ENV_KEY.REDIS_HOST(configService),
					port: ENV_KEY.REDIS_PORT(configService),
					password: ENV_KEY.REDIS_PASSWORD(configService),
				},
			}),
		}),

		// 4. BullMQ module
		BullModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				connection: {
					host: ENV_KEY.REDIS_HOST(configService),
					port: ENV_KEY.REDIS_PORT(configService),
					password: ENV_KEY.REDIS_PASSWORD(configService),
				},
			}),
		}),
		BullModule.registerQueue({
			name: "mail_queue",
		}),

		// 5. Email module
		MailerModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				transport: {
					host: ENV_KEY.MAIL_HOST(configService),
					secure: true,
					auth: {
						user: ENV_KEY.MAIL_USER(configService),
						pass: ENV_KEY.MAIL_PASS(configService),
					},
				},
				defaults: {
					from: ENV_KEY.MAIL_FROM(configService),
				},
				template: {
					dir: join(__dirname, "templates"), // Thư mục chứa file .hbs
					adapter: new HandlebarsAdapter(),
					options: {
						strict: true,
					},
				},
			}),
		}),

		// Other
		UserModule,
		SharedModule,
		AuthModule,
	],
})
export class AppModule {}
