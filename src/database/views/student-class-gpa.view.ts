import { Index, ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
	name: "vw_student_class_gpa",
	materialized: true,
})
@Index(["studentId", "classId"], { unique: true })
export class StudentClassGpaView {
	@ViewColumn({ name: "student_id" })
	studentId!: string;

	@ViewColumn({ name: "class_id" })
	classId!: string;

	@ViewColumn()
	gpa!: number;
}
