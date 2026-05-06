import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClassEntity } from "../../database/entities/class.entity";
import { StudentClassEntity } from "../../database/entities/student-class.entity";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { UserEntity } from "../../database/entities/user.entity";
import { StudentResultService } from "../../shared/services/student-result.service";
import { ClassController } from "./class.controller";
import { ClassService } from "./class.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([
			ClassEntity,
			StudentClassEntity,
			TestEntity,
			UserEntity,
			StudentResultEntity,
		]),
	],
	controllers: [ClassController],
	providers: [ClassService, StudentResultService],
})
export class ClassModule {}
