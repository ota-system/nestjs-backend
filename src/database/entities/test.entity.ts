import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./base.entity";
import { ClassEntity } from "./class.entity";
import { QuestionEntity } from "./question.entity";
import { TopicEntity } from "./topic.entity";

@Entity({ name: "tests" })
export class TestEntity extends BaseEntity {
	@Column({ name: "test_name" })
	testName!: string;

	@ManyToOne(
		() => ClassEntity,
		(clazz) => clazz.tests,
		{
			nullable: false,
			onDelete: "CASCADE",
		},
	)
	@JoinColumn({ name: "class_id" })
	class!: ClassEntity;

	@ManyToOne(
		() => TopicEntity,
		(topic) => topic.tests,
		{
			nullable: false,
			onDelete: "CASCADE",
		},
	)
	@JoinColumn({ name: "topic_id" })
	topic!: TopicEntity;

	@Column({ name: "started_time" })
	startedTime!: Date;

	@Column()
	duration!: number;

	@Column({ name: "anti_cheating", default: false })
	antiCheating!: boolean;

	@Column({ name: "total_questions", default: 0, nullable: false })
	totalQuestions!: number;

	@OneToMany(
		() => QuestionEntity,
		(question) => question.test,
	)
	questions?: QuestionEntity[];
}
