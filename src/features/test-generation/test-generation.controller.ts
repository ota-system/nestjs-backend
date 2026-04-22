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
import { UserRole } from "../auth/entities/user-role.enum";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/role.guard";

@Controller({ path: "test-generation", version: "1" })
export class TestGenerationController {
	constructor(private readonly openRouterService: OpenRouterService) {}

	@Sse("generate-stream")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@ApiBearerAuth()
	@Roles(UserRole.TEACHER)
	streamTestGeneration(
		@Query("prompt") prompt: string,
	): Observable<MessageEvent> {
		return this.openRouterService.generateFromTeacherPromptStream(prompt);
	}
}
