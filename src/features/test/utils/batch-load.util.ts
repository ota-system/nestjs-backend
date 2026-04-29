import { In, Repository } from "typeorm";

/**
 * Batch load entities by IDs and return a Map for fast lookup
 * @param repository TypeORM repository
 * @param ids Array of IDs to load
 * @returns Map<id, entity>
 */
export async function batchLoad<T extends { id: string }>(
	repository: Repository<T>,
	ids: string[],
): Promise<Map<string, T>> {
	if (ids.length === 0) {
		return new Map();
	}

	const entities = await repository.find({
		where: { id: In(ids) } as any,
	});

	return new Map(entities.map((entity) => [entity.id, entity]));
}
