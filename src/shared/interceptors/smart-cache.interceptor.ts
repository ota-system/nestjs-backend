import {
	CallHandler,
	ExecutionContext,
	Injectable,
	Logger,
	NestInterceptor,
	SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, of, tap } from "rxjs";
import { z } from "zod";
import { RedisService } from "../redis/redis.service";

export const CACHE_OPTIONS = "cache_options";

export interface CacheOptions {
	keyPrefix: string;
	target: "params" | "body" | "query";
	targetField: string;
	ttlSeconds?: number;
}

export const SmartCache = (options: CacheOptions) =>
	SetMetadata(CACHE_OPTIONS, options);

@Injectable()
export class UniversalSmartCacheInterceptor implements NestInterceptor {
	private readonly logger = new Logger(UniversalSmartCacheInterceptor.name);

	constructor(
		private readonly redisService: RedisService,
		private readonly reflector: Reflector,
	) {}

	async intercept(
		context: ExecutionContext,
		next: CallHandler,
	): Promise<Observable<any>> {
		const options = this.reflector.get<CacheOptions>(
			CACHE_OPTIONS,
			context.getHandler(),
		);

		if (!options) return next.handle();

		const request = context.switchToHttp().getRequest();
		const id: string | undefined =
			request[options.target]?.[options.targetField];

		if (!id) return next.handle();

		const userId = request.user?.sub || request.user?.id;
		const cacheKey = `${options.keyPrefix}:${userId}:${id}`;

		const cached = await this.redisService.getCache(cacheKey, z.any());
		if (cached !== null) {
			this.logger.debug(`[Cache HIT] ${cacheKey}`);
			return of(cached);
		}

		this.logger.debug(`[Cache MISS] ${cacheKey}`);

		return next.handle().pipe(
			tap((data) => {
				const ttl = options.ttlSeconds ?? 60;
				this.redisService
					.setCache(cacheKey, data, ttl)
					.then(() => {
						this.logger.debug(`[Cache SET] ${cacheKey} (TTL: ${ttl}s)`);
					})
					.catch((err) => {
						this.logger.error(`Failed to set cache for ${cacheKey}`, err);
					});
			}),
		);
	}
}

export const INVALIDATE_CACHE_OPTIONS = "invalidate_cache_options";

export interface InvalidateOptions {
	keyPrefix: string;
	target: "params" | "body" | "query";
	targetField: string;
}

export const InvalidateCache = (options: InvalidateOptions[]) =>
	SetMetadata(INVALIDATE_CACHE_OPTIONS, options);

@Injectable()
export class UniversalInvalidateCacheInterceptor implements NestInterceptor {
	private readonly logger = new Logger(
		UniversalInvalidateCacheInterceptor.name,
	);

	constructor(
		private readonly redisService: RedisService,
		private readonly reflector: Reflector,
	) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const optionsArray = this.reflector.get<InvalidateOptions[]>(
			INVALIDATE_CACHE_OPTIONS,
			context.getHandler(),
		);

		if (!optionsArray?.length) return next.handle();

		const request = context.switchToHttp().getRequest();

		return next.handle().pipe(
			tap(async () => {
				await Promise.all(
					optionsArray.map(async (opt) => {
						const id: string | undefined =
							request[opt.target]?.[opt.targetField];
						if (!id) return;

						const cacheKey = `${opt.keyPrefix}:${id}`;
						await this.redisService.delCache(cacheKey);
						this.logger.log(`[Cache DEL] ${cacheKey}`);
					}),
				);
			}),
		);
	}
}
