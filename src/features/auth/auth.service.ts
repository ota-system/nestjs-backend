import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import type { Repository } from "typeorm";
import { UserEntity } from "../../database/entities/user.entity";
import { ENV_KEY } from "../../shared/constants/env.constant";
import { MailService } from "../../shared/mail/mail.service";
import { RedisService } from "../../shared/redis/redis.service";
import { UserRole } from "../../shared/types/user-role.enum";
import { RefreshJwtPayload } from "./auth.type";
import type { AuthTokensResDto } from "./dto/auth-tokens-res.dto";
import type { SignUpDto } from "./dto/sign-up.dto";
import { EmailAlreadyRegisteredException } from "./exception/email-already-register.exception";

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly redisService: RedisService,
		private readonly mailService: MailService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	// ─── Sign Up ───────────────────────────────────────────────────────────────

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
		await this.redisService.saveVerificationToken(token, savedUser.id);

		const frontendUrl = ENV_KEY.FRONTEND_URL(this.configService);
		const url = `${frontendUrl}/auth/verify?token=${token}`;

		await this.mailService.sendMail({
			to: email,
			subject: "Xác thực tài khoản OTA-Hub",
			template: "./verification",
			context: {
				name: fullName,
				url,
			},
		});

		return savedUser;
	}

	// ─── Verify token & return JWT tokens ─────────────────────────────────────

	async verifyTokenAndLogin(token: string): Promise<AuthTokensResDto> {
		const userId = await this.redisService.getUserIdByToken(token);

		if (!userId) {
			throw new BadRequestException("Đường dẫn không hợp lệ hoặc đã hết hạn.");
		}

		const user = await this.userRepository.findOne({ where: { id: userId } });

		if (!user) {
			throw new NotFoundException("Người dùng không tồn tại.");
		}

		if (user.isActive) {
			throw new BadRequestException("Tài khoản đã được xác thực trước đó.");
		}

		user.isActive = true;
		await this.userRepository.save(user);
		await this.redisService.deleteToken(token);

		return this.generateTokens(user);
	}

	// ─── Token generation ──────────────────────────────────────────────────────

	public async generateTokens(user: UserEntity): Promise<AuthTokensResDto> {
		const sessionId = randomUUID();
		const payload = {
			sub: user.id,
			email: user.email,
			role: user.role,
			sid: sessionId,
		};

		const accessToken = await this.jwtService.signAsync(payload);

		const refreshExpires = ENV_KEY.JWT_REFRESH_EXPIRES(this.configService);
		const refreshTtlSec = ENV_KEY.JWT_REFRESH_EXPIRES_SECONDS(
			this.configService,
		);
		const refreshToken = await this.jwtService.signAsync(
			{ sub: user.id, sid: sessionId },
			{
				secret: ENV_KEY.JWT_SECRET(this.configService),
				// biome-ignore lint/suspicious/noExplicitAny: @nestjs/jwt StringValue type limitation
				expiresIn: refreshExpires as any,
			},
		);

		await this.redisService.saveRefreshSession(
			user.id,
			sessionId,
			refreshToken,
			refreshTtlSec,
		);

		return { accessToken, refreshToken };
	}

	// ─── Helpers ───────────────────────────────────────────────────────────────

	private async checkEmailExists(email: string): Promise<boolean> {
		const user = await this.userRepository.findOne({ where: { email } });
		return !!user;
	}

	async loginLocal(email: string, password: string) {
		const user: UserEntity | null = await this.userRepository.findOne({
			where: { email },
		});
		if (!user) {
			throw new BadRequestException("Email hoặc mật khẩu không chính xác");
		}
		if (!user.isActive) {
			throw new BadRequestException("Tài khoản chưa được xác thực.");
		}

		const isPasswordCorrect = await bcrypt.compare(
			password,
			user.hashedPassword || "",
		);
		if (!isPasswordCorrect) {
			throw new BadRequestException("Email hoặc mật khẩu không chính xác");
		}

		return await this.generateTokens(user);
	}

	async loginGoogle(
		googleId: string,
		email: string,
		fullName: string,
		avatarUrl: string | undefined,
	): Promise<AuthTokensResDto> {
		let user = await this.userRepository.findOne({
			where: { email },
		});

		if (!user) {
			user = this.userRepository.create({
				googleId: googleId,
				email,
				provider: "google",
				isActive: true,
				fullName: fullName,
				avatarUrl: avatarUrl,
			});

			await this.userRepository.save(user);
		}

		if (!user.isActive) {
			user.isActive = true;
			await this.userRepository.save(user);
		}

		return this.generateTokens(user);
	}

	async signout(
		userId: string,
		accessSessionId: string,
		accessExp: number,
		refreshToken: string,
	): Promise<boolean> {
		const nowSec = Math.floor(Date.now() / 1000);
		const accessTtlSec = Math.max(accessExp - nowSec, 1);
		await this.redisService.revokeAccessSession(accessSessionId, accessTtlSec);

		let refreshPayload: RefreshJwtPayload;

		try {
			refreshPayload = await this.jwtService.verifyAsync<RefreshJwtPayload>(
				refreshToken,
				{
					secret: ENV_KEY.JWT_SECRET(this.configService),
				},
			);
		} catch {
			return true;
		}

		if (
			!refreshPayload?.sub ||
			refreshPayload.sub !== userId ||
			refreshPayload.sid !== accessSessionId ||
			!refreshPayload.sid
		) {
			return true;
		}

		const currentSession = await this.redisService.getRefreshSession(
			userId,
			refreshPayload.sid,
		);
		if (
			currentSession &&
			!currentSession.isRevoked &&
			currentSession.token === refreshToken
		) {
			await this.redisService.deleteRefreshSession(userId, refreshPayload.sid);
		}

		return true;
	}
}
