import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClassEntity } from "../../database/entities/class.entity";
import { StudentClassEntity } from "../../database/entities/student-class.entity";
import { UserEntity } from "../../database/entities/user.entity";
import { ClassController } from "./class.controller";
import { ClassService } from "./class.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([ClassEntity, StudentClassEntity, UserEntity]),
	],
	controllers: [ClassController],
	providers: [ClassService],
})
export class ClassModule {}
