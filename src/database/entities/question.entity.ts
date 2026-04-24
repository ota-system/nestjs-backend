import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { TestEntity } from "./test.entity";

@Entity({ name: "questions" })
export class QuestionEntity extends BaseEntity {
	@ManyToOne(
		() => TestEntity,
		(test) => test.questions,
		{
			nullable: false,
			onDelete: "CASCADE",
		},
	)
	@JoinColumn({ name: "test_id" })
	test!: TestEntity;

	@Column()
	level!: string;

	@Column()
	type!: string;

	@Column()
	question!: string;

	@Column("simple-array", { nullable: true })
	options?: string[];

	@Column()
	answer!: string;

	@Column({ nullable: true })
	explanation?: string;
}
