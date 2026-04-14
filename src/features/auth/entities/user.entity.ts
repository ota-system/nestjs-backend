import { Exclude } from "class-transformer";
import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { UserRole } from "./user-role.enum";

@Entity("users")
@Index(["email"])
@Index(["googleId"])
export class UserEntity {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ name: "full_name", type: "varchar", length: 100, nullable: false })
	fullName!: string;

	@Exclude()
	@Column({ name: "hashed_password", type: "text", nullable: true })
	hashedPassword?: string;

	@Column({ name: "google_id", type: "varchar", nullable: true, unique: true })
	googleId?: string;

	@Column({ name: "avatar_url", type: "text", nullable: true })
	avatarUrl?: string;

	@Column({ type: "varchar", length: 100, nullable: false, unique: true })
	email!: string;

	@Column({
		type: "enum",
		enum: UserRole,
		default: null,
		nullable: true,
	})
	role?: UserRole;

	@Column({
		type: "varchar",
		length: 20,
		default: "local",
	})
	provider!: string; //2 options: 'local' | 'google'

	@Column({ default: true })
	isActive!: boolean;

	@CreateDateColumn({ name: "created_at" })
	createdAt!: Date;

	@UpdateDateColumn({ name: "updated_at" })
	updatedAt!: Date;

	@DeleteDateColumn({ name: "deleted_at", nullable: true })
	deletedAt?: Date;
}
