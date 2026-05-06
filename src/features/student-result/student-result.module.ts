import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QuestionEntity } from "../../database/entities/question.entity";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { StudentModule } from "../student/student.module";
import { StudentResultController } from "./student-result.controller";
import { StudentResultService } from "./student-result.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([StudentResultEntity, QuestionEntity]),
		StudentModule,
	],
	controllers: [StudentResultController],
	providers: [StudentResultService],
})
export class StudentResultModule {}
