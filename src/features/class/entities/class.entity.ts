import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "../../../shared/entity/base.entity";
import { UserEntity } from "../../auth/entities/user.entity";
import { StudentClassEntity } from "./student-class.entity";
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
}
