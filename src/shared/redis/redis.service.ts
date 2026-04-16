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

	private getRefreshSessionIndexKey(userId: string): string {
		return `refresh_session_index:${userId}`;
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

		await this.redis
			.multi()
			.set(key, JSON.stringify(record), "EX", ttlSeconds)
			.sadd(this.getRefreshSessionIndexKey(userId), sessionId)
			.exec();
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
		await this.redis
			.multi()
			.del(key)
			.srem(this.getRefreshSessionIndexKey(userId), sessionId)
			.exec();
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
		const value = await this.redis.get(key);
		return value === "1";
	}
}
