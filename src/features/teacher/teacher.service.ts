import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClassEntity } from "../../database/entities/class.entity";

@Injectable()
export class TeacherService {
	constructor(
		@InjectRepository(ClassEntity)
		private readonly classRepository: Repository<ClassEntity>,
	) {}

	async getOverViewInfo(teacherId: string) {
		const classroom = await this.classRepository
			.createQueryBuilder("class")
			.leftJoin("class.students", "students")
			.leftJoin("class.teacher", "teacher")
			.leftJoin("class.tests", "tests")
			.select("COUNT(DISTINCT class.id)", "totalClasses")
			.addSelect("COUNT(DISTINCT students.id)", "totalStudents")
			.addSelect("COUNT(DISTINCT tests.id)", "totalTests")
			.where("teacher.id = :id", { id: teacherId })
			.getRawOne();

		return {
			totalClasses: parseInt(classroom.totalClasses, 10) || 0,
			totalStudents: parseInt(classroom.totalStudents, 10) || 0,
			totalTests: parseInt(classroom.totalTests, 10) || 0,
		};
	}
}
