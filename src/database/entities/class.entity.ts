import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./base.entity";
import { StudentClassEntity } from "./student-class.entity";

import { TestEntity } from "./test.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "classes" })
export class ClassEntity extends BaseEntity {
	@Column()
	name!: string;

	@Column()
	subject!: string;

	@Column({ unique: true })
	code!: string;

	@ManyToOne(
		() => UserEntity,
		(user) => user.teacherClasses,
		{
			nullable: false,
			onDelete: "CASCADE",
		},
	)
	@JoinColumn({ name: "teacher_id" })
	teacher!: UserEntity;

	@OneToMany(
		() => StudentClassEntity,
		(sc) => sc.class,
	)
	students?: StudentClassEntity[];

	@OneToMany(
		() => TestEntity,
		(test) => test.class,
	)
	tests?: TestEntity[];
}
