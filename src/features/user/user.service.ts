import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { plainToInstance } from "class-transformer";
import { Repository } from "typeorm";
import { AuthService } from "../auth/auth.service";
import { AuthTokensResDto } from "../auth/dto/auth-tokens-res.dto";
import { UserEntity } from "../auth/entities/user.entity";
import { UserRole } from "../auth/entities/user-role.enum";
import { UserResponseDto } from "./dtos/user-res.dto";

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly authService: AuthService,
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

	async updateUserRole(
		currentUserId: string,
		userId: string,
		newRole: UserRole,
	): Promise<AuthTokensResDto> {
		if (currentUserId !== userId) {
			throw new ForbiddenException("Không thể cập nhật vai trò của người khác");
		}

		const user = await this.userRepository.findOneBy({ id: userId });

		if (!user) {
			throw new NotFoundException("Người dùng không tồn tại");
		}

		if (!this.canUserUpdateRole(user)) {
			throw new BadRequestException("Bạn đã chọn vai trò rồi!");
		}

		user.role = newRole;
		const updatedUser = await this.userRepository.save(user);
		return this.authService.generateTokens(updatedUser);
	}

	private canUserUpdateRole(user: UserEntity): boolean {
		return user.role === undefined && user.googleId !== undefined;
	}
}
