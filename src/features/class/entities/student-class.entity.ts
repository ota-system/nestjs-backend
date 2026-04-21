import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "../../auth/entities/user.entity";
import { ClassEntity } from "./class.entity";

@Entity("student_classes")
export class StudentClassEntity {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@CreateDateColumn({ name: "created_at" })
	createdAt!: Date;

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
