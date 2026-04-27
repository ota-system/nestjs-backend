import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClassEntity } from "../../database/entities/class.entity";
import { StudentClassEntity } from "../../database/entities/student-class.entity";
import { UserEntity } from "../../database/entities/user.entity";
import { UserRole } from "../../shared/types/user-role.enum";
import { CreateClassDto } from "./dtos/create-class.dto";
import { AlreadyJoinedException } from "./exceptions/already-joined.exception";

@Injectable()
export class ClassService {
	constructor(
		@InjectRepository(ClassEntity)
		private readonly classRepository: Repository<ClassEntity>,
		@InjectRepository(StudentClassEntity)
		private readonly studentClassRepository: Repository<StudentClassEntity>,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
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

	async addStudentToClass(
		studentId: string,
		classId: string,
	): Promise<StudentClassEntity> {
		const classroom = await this.classRepository.findOne({
			where: { id: classId },
		});

		if (!classroom) {
			throw new NotFoundException("Không tìm thấy lớp học hoặc mã không đúng");
		}

		if (!(await this.isUserExist(studentId))) {
			throw new NotFoundException("Tài khoản không tồn tại");
		}

		if (await this.isStudentJoinedClass(studentId, classroom.id)) {
			throw new AlreadyJoinedException();
		}

		const studentClass = this.studentClassRepository.create({
			student: { id: studentId },
			class: classroom,
			status: "active",
		});

		return await this.studentClassRepository.save(studentClass);
	}

	async getClassByCode(code: string): Promise<ClassEntity> {
		const classroom = await this.classRepository.findOne({
			where: { code: code },
			relations: ["teacher"],
		});

		if (!classroom) {
			throw new NotFoundException("Không tìm thấy lớp học hoặc mã không đúng");
		}

		return classroom;
	}

	private async isUserExist(userId: string) {
		return await this.userRepository.exists({
			where: { id: userId },
		});
	}

	private async isStudentJoinedClass(studentId: string, classId: string) {
		return await this.studentClassRepository.exists({
			where: { student: { id: studentId }, class: { id: classId } },
		});
	}
}
