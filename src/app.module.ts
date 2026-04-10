import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserModule } from "./features/user/user.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SharedModule } from "./shared/shared.module";
import { getTypeOrmConfig } from "./shared/configs/type-orm.config";

@Module({
	imports: [
		ConfigModule.forRoot(),
		UserModule,
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getTypeOrmConfig
		}),
		SharedModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
