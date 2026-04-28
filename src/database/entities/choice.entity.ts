import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { QuestionEntity } from "./question.entity";

@Entity({ name: "choices" })
export class ChoiceEntity extends BaseEntity {
	@JoinColumn({ name: "question_id" })
	@ManyToOne(
		() => QuestionEntity,
		(question) => question.choices,
		{
			nullable: false,
			onDelete: "CASCADE",
		},
	)
	question!: QuestionEntity;

	@Column({ nullable: false })
	answer!: string;

	@Column({ name: "is_correct", nullable: false, default: false })
	isCorrect!: boolean;
}
