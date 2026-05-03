import { RedisService as NestRedisService } from "@liaoliaots/nestjs-redis";
import { Inject, Injectable } from "@nestjs/common";
import type Redis from "ioredis";

export type RefreshSessionRecord = {
	userId: string;
	sessionId: string;
	token: string;
	expiredAt: string;
	isRevoked: boolean;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
};

@Injectable()
export class RedisService {
	constructor(
		@Inject(NestRedisService) private readonly redisService: NestRedisService,
	) {}

	private get redis(): Redis {
		return this.redisService.getOrThrow();
	}

	private getRefreshSessionKey(userId: string, sessionId: string): string {
		return `refresh_session:${userId}:${sessionId}`;
	}

	private getRevokedAccessSessionKey(sessionId: string): string {
		return `revoked_access_sid:${sessionId}`;
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

	// Refresh session Handle (multi-device)

	async saveRefreshSession(
		userId: string,
		sessionId: string,
		token: string,
		ttlSeconds: number,
	): Promise<void> {
		const key = this.getRefreshSessionKey(userId, sessionId);
		const now = new Date();
		const expiredAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();
		const record: RefreshSessionRecord = {
			userId,
			sessionId,
			token,
			expiredAt,
			isRevoked: false,
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
			deletedAt: null,
		};

		await this.redis.set(key, JSON.stringify(record), "EX", ttlSeconds);
	}

	async getRefreshSession(
		userId: string,
		sessionId: string,
	): Promise<RefreshSessionRecord | null> {
		const key = this.getRefreshSessionKey(userId, sessionId);
		const value = await this.redis.get(key);
		if (!value) {
			return null;
		}

		try {
			return JSON.parse(value) as RefreshSessionRecord;
		} catch {
			return null;
		}
	}

	async deleteRefreshSession(userId: string, sessionId: string): Promise<void> {
		const key = this.getRefreshSessionKey(userId, sessionId);
		await this.redis.del(key);
	}

	async revokeAccessSession(
		sessionId: string,
		ttlSeconds: number,
	): Promise<void> {
		const key = this.getRevokedAccessSessionKey(sessionId);
		await this.redis.set(key, "1", "EX", ttlSeconds);
	}

	async isAccessSessionRevoked(sessionId: string): Promise<boolean> {
		const key = this.getRevokedAccessSessionKey(sessionId);
		const exists = await this.redis.exists(key);
		return exists > 0;
	}

	async getCache<T>(key: string): Promise<T | null> {
		const value = await this.redis.get(key);
		if (!value) return null;
		try {
			return JSON.parse(value) as T;
		} catch {
			return null;
		}
	}

	async setCache(
		key: string,
		value: unknown,
		ttlSeconds: number,
	): Promise<void> {
		await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
	}

	async deleteCache(key: string): Promise<void> {
		await this.redis.del(key);
	}
}
