import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { StudentController } from "./student.controller";
import { StudentService } from "./student.service";

@Module({
	imports: [TypeOrmModule.forFeature([StudentResultEntity])],
	controllers: [StudentController],
	providers: [StudentService],
	exports: [StudentService],
})
export class StudentModule {}
