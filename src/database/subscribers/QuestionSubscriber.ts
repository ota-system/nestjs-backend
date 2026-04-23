import {
	EntitySubscriberInterface,
	EventSubscriber,
	InsertEvent,
	RemoveEvent,
} from "typeorm";
import { QuestionEntity } from "../entities/question.entity";
import { TestEntity } from "../entities/test.entity";

@EventSubscriber()
export class QuestionSubscriber
	implements EntitySubscriberInterface<QuestionEntity>
{
	listenTo() {
		return QuestionEntity;
	}

	async afterInsert(event: InsertEvent<QuestionEntity>) {
		await this.updateTotalQuestions(event.manager, event.entity.test.id, 1);
	}

	async afterRemove(event: RemoveEvent<QuestionEntity>) {
		await this.updateTotalQuestions(
			event.manager,
			event.databaseEntity.test.id,
			-1,
		);
	}

	private async updateTotalQuestions(
		manager: any,
		id: string,
		increment: number,
	) {
		await manager.increment(
			TestEntity,
			{ id: id },
			"totalQuestions",
			increment,
		);
	}
}
