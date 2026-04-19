import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { getJwtConfig } from "../../shared/configs/jwt.config";
import { SharedModule } from "../../shared/shared.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserEntity } from "./entities/user.entity";
import { GoogleAuthService } from "./infras/google-auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity]),
		PassportModule.register({ defaultStrategy: "jwt" }),
		BullModule.registerQueue({ name: "mail_queue" }),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getJwtConfig,
		}),
		SharedModule,
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, GoogleAuthService],
	exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
