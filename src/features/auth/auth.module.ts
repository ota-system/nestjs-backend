import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserEntity } from "./entities/user.entity";

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity]),
		PassportModule.register({ defaultStrategy: "jwt" }),
	],
	controllers: [AuthController],
	providers: [AuthService],
	exports: [AuthService],
})
export class AuthModule {}
