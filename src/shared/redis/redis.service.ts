import { RedisService as NestRedisService } from "@liaoliaots/nestjs-redis";
import { Inject, Injectable } from "@nestjs/common";
import type Redis from "ioredis";

@Injectable()
export class RedisService {
	constructor(
		@Inject(NestRedisService) private readonly redisService: NestRedisService,
	) {}

	private get redis(): Redis {
		return this.redisService.getOrThrow();
	}

	// Verification token Handle

	async saveVerificationToken(token: string, userId: string): Promise<void> {
		const key = `verify_token:${token}`;
		await this.redis.set(key, userId, "EX", 15 * 60); // 15 mins
	}

	async getUserIdByToken(token: string): Promise<string | null> {
		const key = `verify_token:${token}`;
		return await this.redis.get(key);
	}

	async deleteToken(token: string): Promise<void> {
		const key = `verify_token:${token}`;
		await this.redis.del(key);
	}

	// Refresh token Handle

	async saveRefreshToken(
		userId: string,
		token: string,
		ttlSeconds: number,
	): Promise<void> {
		const key = `refresh_token:${userId}`;
		await this.redis.set(key, token, "EX", ttlSeconds);
	}

	async getRefreshToken(userId: string): Promise<string | null> {
		const key = `refresh_token:${userId}`;
		return await this.redis.get(key);
	}

	async deleteRefreshToken(userId: string): Promise<void> {
		const key = `refresh_token:${userId}`;
		await this.redis.del(key);
	}
}
