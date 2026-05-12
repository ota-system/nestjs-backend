import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClassEntity } from "../../database/entities/class.entity";
import { StudentClassEntity } from "../../database/entities/student-class.entity";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { UserEntity } from "../../database/entities/user.entity";
import { BaseException } from "../../shared/exception/base.exception";
import { UserRole } from "../../shared/types/user-role.enum";
import { AuthService } from "../auth/auth.service";
import { AuthTokensResDto } from "../auth/dtos/auth-tokens-res.dto";

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		@InjectRepository(ClassEntity)
		private readonly classRepository: Repository<ClassEntity>,
		@InjectRepository(StudentClassEntity)
		private readonly studentClassRepository: Repository<StudentClassEntity>,
		@InjectRepository(StudentResultEntity)
		private readonly studentResultRepository: Repository<StudentResultEntity>,
		private readonly authService: AuthService,
	) {}

	async findUserById(id: string): Promise<UserEntity> {
		const user = await this.userRepository.findOneBy({ id });
		if (!user) {
			throw new BaseException(404, "USER_NOT_FOUND");
		}
		return user;
	}

	async updateUserRole(
		currentUserId: string,
		newRole: UserRole,
	): Promise<AuthTokensResDto> {
		const user = await this.userRepository.findOneBy({ id: currentUserId });

		if (!user) {
			throw new BaseException(404, "USER_NOT_FOUND");
		}

		if (!this.canUserUpdateRole(user)) {
			throw new BaseException(400, "ROLE_ALREADY_SET");
		}

		user.role = newRole;
		const updatedUser = await this.userRepository.save(user);
		return this.authService.generateTokens(updatedUser);
	}

	async getTeacherClassStats(teacherId: string) {
		const raw = await this.classRepository
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
			totalClasses: parseInt(raw.totalClasses, 10) || 0,
			totalStudents: parseInt(raw.totalStudents, 10) || 0,
			totalTests: parseInt(raw.totalTests, 10) || 0,
		};
	}

	async getStudentClassStats(studentId: string) {
		const [classStats, resultStats] = await Promise.all([
			this.studentClassRepository
				.createQueryBuilder("sc")
				.select("COUNT(DISTINCT sc.class_id)", "totalClasses")
				.where("sc.student_id = :studentId", { studentId })
				.getRawOne(),
			this.studentResultRepository
				.createQueryBuilder("sr")
				.select("COUNT(sr.id)", "totalTestResults")
				.addSelect("COALESCE(AVG(sr.score), 0)", "averageScore")
				.where("sr.student_id = :studentId", { studentId })
				.getRawOne(),
		]);

		return {
			totalClasses: parseInt(classStats.totalClasses, 10) || 0,
			totalTestResults: parseInt(resultStats.totalTestResults, 10) || 0,
			averageScore:
				parseFloat(parseFloat(resultStats.averageScore).toFixed(2)) || 0,
		};
	}

	private canUserUpdateRole(user: UserEntity): boolean {
		return user.role === null && user.googleId !== null;
	}
}
