import {
	Controller,
	MessageEvent,
	Query,
	Sse,
	UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Observable } from "rxjs";
import { Roles } from "../../shared/decorators/roles.decorator";
import { OpenRouterService } from "../../shared/infras/openRouter.service";
import { UserRole } from "../../shared/types/user-role.enum";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/role.guard";
import { TeacherPromptRequestDto } from "./dtos/teacher-prompt.req.dto";

@Controller({ path: "test-generation", version: "1" })
export class TestGenerationController {
	constructor(private readonly openRouterService: OpenRouterService) {}

	@Sse("generate-stream")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@ApiBearerAuth()
	@Roles(UserRole.TEACHER)
	streamTestGeneration(
		@Query() dto: TeacherPromptRequestDto,
	): Observable<MessageEvent> {
		return this.openRouterService.generateFromTeacherPromptStream(dto.prompt);
	}
}
