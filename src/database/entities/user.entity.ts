import { Exclude } from "class-transformer";
import { Column, Entity, Index, OneToMany } from "typeorm";
import { UserRole } from "../../shared/types/user-role.enum";
import { BaseEntity } from "./base.entity";
import { ClassEntity } from "./class.entity";
import { StudentClassEntity } from "./student-class.entity";

@Entity("users")
@Index(["email"])
@Index(["googleId"])
export class UserEntity extends BaseEntity {
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
		type: "varchar",
		length: 50,
		default: null,
		nullable: true,
	})
	role?: UserRole;

	@Column({
		type: "varchar",
		length: 20,
		default: "local",
	})
	provider!: string; // 'local' | 'google'

	@Column({ name: "is_active", default: true })
	isActive!: boolean;

	@OneToMany(
		() => ClassEntity,
		(classes) => classes.teacher,
	)
	teacherClasses?: ClassEntity[];

	@OneToMany(
		() => StudentClassEntity,
		(sc) => sc.student,
	)
	studentClasses?: StudentClassEntity[];
}
