import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { plainToInstance } from "class-transformer";
import { Repository } from "typeorm";
import { UserEntity } from "../auth/entities/user.entity";
import { UserResponseDto } from "./dtos/user-res.dto";

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
	) {}

	async findUserById(id: string): Promise<UserResponseDto> {
		const user = await this.userRepository.findOneBy({ id });
		if (!user) {
			throw new NotFoundException(
				"Người dùng không còn tồn tại hoặc không hợp lệ",
			);
		}
		return plainToInstance(UserResponseDto, user, {
			excludeExtraneousValues: true,
		});
	}
}
