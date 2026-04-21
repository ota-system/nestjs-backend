import {
	CreateDateColumn,
	DeleteDateColumn,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

export abstract class BaseEntity {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@CreateDateColumn({ name: "created_at" })
	createdAt!: Date;

	@UpdateDateColumn({ nullable: true, name: "updated_at" })
	updatedAt?: Date;

	@DeleteDateColumn({ nullable: true, name: "deleted_at" })
	deletedAt?: Date;
}
