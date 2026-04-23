import { Column, Entity, OneToMany } from "typeorm";
import { BaseEntity } from "./base.entity";
import { TestEntity } from "./test.entity";

@Entity({ name: "topics" })
export class TopicEntity extends BaseEntity {
	@Column({ name: "topic_name" })
	topicName!: string;

	@OneToMany(
		() => TestEntity,
		(test) => test.topic,
	)
	tests?: TestEntity[];
}
