import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "../auth/entities/user.entity";
import { ClassController } from "./class.controller";
import { ClassService } from "./class.service";
import { ClassEntity } from "./entities/class.entity";
import { StudentClassEntity } from "./entities/student-class.entity";

@Module({
	imports: [
		TypeOrmModule.forFeature([ClassEntity, StudentClassEntity, UserEntity]),
	],
	controllers: [ClassController],
	providers: [ClassService],
})
export class ClassModule {}
