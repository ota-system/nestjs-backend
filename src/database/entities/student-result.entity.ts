import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";

import { TestEntity } from "./test.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "student_results" })
export class StudentResultEntity extends BaseEntity {
	@JoinColumn({ name: "student_id" })
	@ManyToOne(
		() => UserEntity,
		(user) => user.studentResults,
		{
			nullable: false,
			onDelete: "CASCADE",
		},
	)
	student!: UserEntity;

	@JoinColumn({ name: "exam_id" })
	@ManyToOne(
		() => TestEntity,
		(test) => test.studentResults,
		{
			nullable: false,
			onDelete: "CASCADE",
		},
	)
	exam!: TestEntity;

	@Column({ type: "float", default: 0 })
	score!: GLfloat;

	@Column({ type: "json", nullable: true })
	mistakes?: JSON;
}
