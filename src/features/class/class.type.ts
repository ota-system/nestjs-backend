import { ClassEntity } from "../../database/entities/class.entity";

export type ClassWithCounts = ClassEntity & {
	studentCount: number;
	testCount: number;
};
