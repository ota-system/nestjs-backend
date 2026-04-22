import { Controller, MessageEvent, Query, Sse } from "@nestjs/common";
import { Observable } from "rxjs";
import { OpenRouterService } from "../../shared/infras/openRouter.service";

@Controller({ path: "test-generation", version: "1" })
export class TestGenerationController {
	constructor(private readonly openRouterService: OpenRouterService) {}

	@Sse("generate-stream")
	streamTestGeneration(
		@Query("prompt") prompt: string,
	): Observable<MessageEvent> {
		return this.openRouterService.generateFromTeacherPromptStream(prompt);
	}
}
