import { CreateClassRequestDto } from "./create-class-req.dto";

export class CreateClassDto extends CreateClassRequestDto {
	teacherId!: string;
}
