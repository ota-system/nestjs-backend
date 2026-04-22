import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserRole } from "../auth/entities/user-role.enum";
import { CreateClassDto } from "./dtos/create-class.dto";
import { ClassEntity } from "./entities/class.entity";

@Injectable()
export class ClassService {
	constructor(
		@InjectRepository(ClassEntity)
		private readonly classRepository: Repository<ClassEntity>,
	) {}

	async createClass(dto: CreateClassDto) {
		const code = await this.generateUniqueClassCode();

		const classroom = this.classRepository.create({
			name: dto.name,
			subject: dto.subject,
			teacher: { id: dto.teacherId },
			code: code,
		});
		return await this.classRepository.save(classroom);
	}

	private async isClassCodeExisted(code: string) {
		const isExisted = await this.classRepository.exists({
			where: { code: code },
		});
		return isExisted;
	}

	private async generateUniqueClassCode(): Promise<string> {
		let code: string;
		let isExisted: boolean;

		do {
			code = Math.floor(100000 + Math.random() * 900000).toString();
			isExisted = await this.isClassCodeExisted(code);
		} while (isExisted);

		return code;
	}

	async getClassList(userId: string, role: string) {
		if (role === UserRole.TEACHER) {
			return await this.classRepository.find({
				where: { teacher: { id: userId } },
				order: { createdAt: "DESC" },
			});
		} else if (role === UserRole.STUDENT) {
			return await this.classRepository.find({
				where: { students: { student: { id: userId } } },
				order: { createdAt: "DESC" },
			});
		}
		return [];
	}

	async getClassDetail(classId: string, userId: string, role: string) {
		const classroom = await this.classRepository.findOne({
			where: { id: classId },
			relations: ["teacher", "students", "students.student"],
		});
		if (!classroom) {
			throw new NotFoundException("Không tìm thấy lớp học");
		}

		const isTeacher =
			role === UserRole.TEACHER && classroom.teacher.id === userId;
		const isStudent =
			role === UserRole.STUDENT &&
			classroom.students?.some((sc) => sc.student.id === userId);

		if (!isTeacher && !isStudent) {
			throw new ForbiddenException("Bạn không có quyền truy cập lớp học này");
		}

		return classroom;
	}

	async getStudentsInClass(classId: string, userId: string, role: string) {
		const classroom = await this.getClassDetail(classId, userId, role);
		return classroom.students?.map((sc) => sc.student) || [];
	}
}
