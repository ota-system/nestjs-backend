import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "../../database/entities/user.entity";
import { AuthModule } from "../auth/auth.module";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
	imports: [TypeOrmModule.forFeature([UserEntity]), AuthModule],
	providers: [UserService],
	controllers: [UserController],
	exports: [],
})
export class UserModule {}
