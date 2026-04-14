import * as path from "node:path"; // Dùng node:path cho chuẩn Biome/Node
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HeaderResolver, I18nModule, QueryResolver } from "nestjs-i18n";
import { AuthModule } from "./features/auth/auth.module";
import { UserModule } from "./features/user/user.module";
import { getTypeOrmConfig } from "./shared/configs/type-orm.config";
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

		// 3. Other
		UserModule,
		SharedModule,
		AuthModule,
	],
})
export class AppModule {}
