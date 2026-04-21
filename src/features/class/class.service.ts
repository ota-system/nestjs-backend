import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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
}
