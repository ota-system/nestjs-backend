import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import type { Repository } from "typeorm";
import type { MailService } from "../../shared/mail/mail.service";
import type { RedisService } from "../../shared/redis/redis.service";
import type { SignUpDto } from "./dto/sign-up.dto";
import { UserEntity } from "./entities/user.entity";
import type { UserRole } from "./entities/user-role.enum";
import { EmailAlreadyRegisteredException } from "./exception/email-already-register.exception";

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly redisService: RedisService,
		private readonly mailService: MailService,
	) {}

	// Func for sign up
	async signUpLocal(signUpDto: SignUpDto): Promise<UserEntity> {
		const { email, password, fullName, role } = signUpDto;

		const emailExists = await this.checkEmailExists(email);
		if (emailExists) {
			throw new EmailAlreadyRegisteredException();
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
		const newUser = this.userRepository.create({
			fullName,
			email,
			hashedPassword,
			role: role as UserRole,
			provider: "local",
			isActive: false,
		});

		const savedUser = await this.userRepository.save(newUser);

		const token = randomUUID();
		await this.redisService.saveVerificationToken(
			token,
			savedUser.id.toString(),
		);

		await this.mailService.sendVerificationEmail(email, fullName, token);

		return savedUser;
	}

	async verifyUserByLinkViaEmail(token: string): Promise<boolean> {
		const userId = await this.redisService.getUserIdByToken(token);

		if (!userId) {
			throw new BadRequestException("Token invalid or expired.");
		}

		const user = await this.userRepository.findOne({ where: { id: userId } });

		if (!user) {
			throw new NotFoundException("User not found.");
		}

		if (user.isActive) {
			throw new BadRequestException("User is already verified.");
		}

		user.isActive = true;
		await this.userRepository.save(user);
		await this.redisService.deleteToken(token);
		return true;
	}

	// Func for check email exists, find user by email, find user by googleId (for google auth)
	private async checkEmailExists(email: string): Promise<boolean> {
		const user = await this.userRepository.findOne({
			where: { email },
		});
		return !!user;
	}

	private async findByEmail(email: string): Promise<UserEntity | null> {
		return this.userRepository.findOne({ where: { email } });
	}

	private async findByGoogleId(googleId: string): Promise<UserEntity | null> {
		return this.userRepository.findOne({ where: { googleId } });
	}
}
