import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClassEntity } from "../../database/entities/class.entity";
import { StudentClassEntity } from "../../database/entities/student-class.entity";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { UserEntity } from "../../database/entities/user.entity";
import { AuthModule } from "../auth/auth.module";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([
			UserEntity,
			ClassEntity,
			StudentClassEntity,
			StudentResultEntity,
		]),
		AuthModule,
	],
	providers: [UserService],
	controllers: [UserController],
	exports: [],
})
export class UserModule {}
