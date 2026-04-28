import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { plainToInstance } from "class-transformer";
import { Repository } from "typeorm";
import { UserEntity } from "../../database/entities/user.entity";
import { BaseException } from "../../shared/exception/base.exception";
import { UserRole } from "../../shared/types/user-role.enum";
import { AuthService } from "../auth/auth.service";
import { AuthTokensResDto } from "../auth/dtos/auth-tokens-res.dto";
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
			throw new BaseException(404, "USER_NOT_FOUND");
		}
		return plainToInstance(UserResponseDto, user, {
			excludeExtraneousValues: true,
		});
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

	private canUserUpdateRole(user: UserEntity): boolean {
		return user.role === null && user.googleId !== null;
	}
}
