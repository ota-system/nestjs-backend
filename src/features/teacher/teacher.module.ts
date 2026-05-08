import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClassEntity } from "../../database/entities/class.entity";
import { TeacherController } from "./teacher.controller";
import { TeacherService } from "./teacher.service";

@Module({
	imports: [TypeOrmModule.forFeature([ClassEntity])],
	controllers: [TeacherController],
	providers: [TeacherService],
})
export class TeacherModule {}
