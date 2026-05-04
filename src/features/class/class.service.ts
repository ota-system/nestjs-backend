import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClassEntity } from "../../database/entities/class.entity";
import { StudentClassEntity } from "../../database/entities/student-class.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { UserEntity } from "../../database/entities/user.entity";
import { BaseException } from "../../shared/exception/base.exception";
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
		@InjectRepository(TestEntity)
		private readonly testRepository: Repository<TestEntity>,
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
			throw new BaseException(404, "CLASS_NOT_FOUND");
		}

		const isTeacher =
			role === UserRole.TEACHER && classroom.teacher.id === userId;
		const isStudent =
			role === UserRole.STUDENT &&
			classroom.students?.some((sc) => sc.student.id === userId);

		if (!isTeacher && !isStudent) {
			throw new BaseException(403, "CLASS_ACCESS_DENIED");
		}

		return classroom;
	}

	async getStudentsInClass(classId: string, userId: string, role: string) {
		const classroom = await this.getClassDetail(classId, userId, role);
		return classroom.students?.map((sc) => sc.student) || [];
	}

	async getTestsByClass({
		classId,
		studentId,
	}: {
		classId: string;
		studentId: string;
	}) {
		const enrollment = await this.studentClassRepository.findOne({
			where: {
				student: { id: studentId },
				class: { id: classId },
			},
		});

		if (!enrollment) {
			throw new BaseException(403, "CLASS_ACCESS_DENIED");
		}

		const tests = await this.testRepository.find({
			where: { class: { id: classId } },
			relations: ["topic"],
			order: { createdAt: "DESC" },
		});

		return tests.map((test) => ({
			id: test.id,
			testName: test.testName,
			startedTime: test.startedTime,
			duration: test.duration,
			totalQuestions: test.totalQuestions,
			antiCheating: test.antiCheating,
			topic: test.topic.topicName,
			createdAt: test.createdAt,
		}));
	}

	async getTestDetail({
		testId,
		studentId,
	}: {
		testId: string;
		studentId: string;
	}) {
		const test = await this.testRepository.findOne({
			where: { id: testId },
			relations: ["topic", "class"],
		});

		if (!test) {
			throw new BaseException(404, "EXAM_NOT_FOUND");
		}

		const enrollment = await this.studentClassRepository.findOne({
			where: {
				student: { id: studentId },
				class: { id: test.class.id },
			},
		});

		if (!enrollment) {
			throw new BaseException(403, "CLASS_ACCESS_DENIED");
		}

		return {
			id: test.id,
			testName: test.testName,
			startedTime: test.startedTime,
			duration: test.duration,
			totalQuestions: test.totalQuestions,
			antiCheating: test.antiCheating,
			topic: test.topic.topicName,
			createdAt: test.createdAt,
		};
	}

	async addStudentToClass(
		studentId: string,
		classId: string,
	): Promise<StudentClassEntity> {
		const classroom = await this.classRepository.findOne({
			where: { id: classId },
		});

		if (!classroom) {
			throw new BaseException(404, "CLASS_NOT_FOUND_OR_INVALID_CODE");
		}

		if (!(await this.isUserExist(studentId))) {
			throw new BaseException(404, "USER_NOT_FOUND");
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
			throw new BaseException(404, "CLASS_NOT_FOUND_OR_INVALID_CODE");
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
