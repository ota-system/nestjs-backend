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

	async saveVerificationToken(token: string, userId: string): Promise<void> {
		const key = `verify_token:${token}`;
		await this.redis.set(key, userId, "EX", 86400); // 86400s = 24h
	}

	async getUserIdByToken(token: string): Promise<string | null> {
		const key = `verify_token:${token}`;
		return await this.redis.get(key);
	}

	async deleteToken(token: string): Promise<void> {
		const key = `verify_token:${token}`;
		await this.redis.del(key);
	}
}
