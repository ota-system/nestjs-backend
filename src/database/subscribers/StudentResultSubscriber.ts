import { EntitySubscriberInterface, EventSubscriber } from "typeorm";
import { triggerRefresh } from "../../shared/utils/view-refresh.helper";
import { StudentResultEntity } from "../entities/student-result.entity";

@EventSubscriber()
export class StudentResultSubscriber
	implements EntitySubscriberInterface<StudentResultEntity>
{
	listenTo() {
		return StudentResultEntity;
	}

	async afterInsert() {
		await triggerRefresh("vw_class_analytics", "insert");
	}

	async afterUpdate() {
		await triggerRefresh("vw_class_analytics", "update");
	}

	async afterRemove() {
		await triggerRefresh("vw_class_analytics", "remove");
	}
}
