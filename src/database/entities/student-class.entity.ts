import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { ClassEntity } from "./class.entity";
import { UserEntity } from "./user.entity";

@Entity("student_classes")
export class StudentClassEntity extends BaseEntity {
	@Column({ default: "active" })
	status!: string;

	@ManyToOne(
		() => UserEntity,
		(user) => user.studentClasses,
	)
	@JoinColumn({ name: "student_id" })
	student!: UserEntity;

	@ManyToOne(
		() => ClassEntity,
		(cls) => cls.students,
	)
	@JoinColumn({ name: "class_id" })
	class!: ClassEntity;
}
