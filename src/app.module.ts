import { RedisModule } from "@liaoliaots/nestjs-redis";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MailerModule } from "@nestjs-modules/mailer";
import { I18nModule } from "nestjs-i18n";
import { AuthModule } from "./features/auth/auth.module";
import { ClassModule } from "./features/class/class.module";
import { HealthModule } from "./features/health/health.module";
import { TestModule } from "./features/test/test.module";
import { TestGenerationModule } from "./features/test-generation/test-generation.module";
import { UserModule } from "./features/user/user.module";
import { getBullConfig } from "./shared/configs/bull.config";
import { getI18nConfig, i18nResolvers } from "./shared/configs/i18n.config";
import { getMailerConfig } from "./shared/configs/mailer.config";
import { getRedisConfig } from "./shared/configs/redis.config";
import { getTypeOrmConfig } from "./shared/configs/type-orm.config";
import { SharedModule } from "./shared/shared.module";

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),

		// 1. I18n
		I18nModule.forRootAsync({
			useFactory: getI18nConfig,
			resolvers: i18nResolvers,
			inject: [ConfigService],
		}),

		// 2. Database
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getTypeOrmConfig,
		}),

		// 3. Redis
		RedisModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getRedisConfig,
		}),

		// 4. BullMQ
		BullModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getBullConfig,
		}),
		BullModule.registerQueue({ name: "mail_queue" }),

		// 5. Mailer
		MailerModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getMailerConfig,
		}),

		// Features
		UserModule,
		SharedModule,
		HealthModule,
		AuthModule,
		ClassModule,
		TestGenerationModule,
		TestModule,
	],
})
export class AppModule {}
