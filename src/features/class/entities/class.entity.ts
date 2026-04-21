import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../shared/entity/base.entity";
import { UserEntity } from "../../auth/entities/user.entity";

@Entity({ name: "classes" })
export class ClassEntity extends BaseEntity {
	@Column()
	name!: string;

	@Column()
	subject!: string;

	@ManyToOne(() => UserEntity, { nullable: false, onDelete: "CASCADE" })
	@JoinColumn({ name: "teacher_id" })
	teacher!: UserEntity;

	@Column({ unique: true })
	code!: string;
}
