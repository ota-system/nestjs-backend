import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "../../auth/entities/user.entity";

@Entity()
export class Class {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column()
	name!: string;

	@Column()
	subject!: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({ name: "teacher_id" })
	teacher!: UserEntity;

	@Column()
	code!: string;

	@CreateDateColumn({ name: "created_at" })
	createdAt!: Date;

	@UpdateDateColumn({ name: "updated_at" })
	updatedAt?: Date;

	@DeleteDateColumn({ name: "deleted_at" })
	deletedAt?: Date;
}
