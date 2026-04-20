import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "../auth/entities/user.entity";
import { CreateClassDto } from "./dtos/create-class.dto";
import { Class } from "./entities/class.entity";

@Injectable()
export class ClassService {
	constructor(
		@InjectRepository(Class)
		private readonly classRepository: Repository<Class>,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
	) {}

	async createClass(dto: CreateClassDto) {
		const isTeacherUser = await this.isTeacher(dto.teacherId);
		if (!isTeacherUser) {
			throw new ForbiddenException("Chỉ giáo viên mới được tạo lớp học");
		}

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

	private async isTeacher(userId: string): Promise<boolean> {
		const user = await this.userRepository.findOne({ where: { id: userId } });
		if (!user) return false;
		return user?.role === "TEACHER";
	}
}
