import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./base.entity";
import { ChoiceEntity } from "./choice.entity";
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

	@Column()
	@Column({ type: "text", nullable: true })
	answer?: string | null;

	@Column({ nullable: true })
	explanation?: string;

	@OneToMany(
		() => ChoiceEntity,
		(choice) => choice.question,
	)
	choices?: ChoiceEntity[];
}
