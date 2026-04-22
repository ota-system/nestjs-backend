import {
	Injectable,
	InternalServerErrorException,
	MessageEvent,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OpenRouter } from "@openrouter/sdk";
import { plainToInstance } from "class-transformer";
import { Observable } from "rxjs";
import { TeacherPromptResponseDto } from "../../features/test-generation/dtos/teacher-prompt.res.dto";
import { ENV_KEY } from "../constants/env.constant";
import prompts from "./prompts.json";

interface QuestionObject {
	id: string;
	question: string;
	topic: string;
	difficulty: "easy" | "medium" | "hard";
	options: string[];
	question_type: "multiple_choice" | "true_false" | "fill_in_the_blank";
	answer: string;
	explanation: string;
}

@Injectable()
export class OpenRouterService {
	constructor(
		private readonly openrouter: OpenRouter,
		private readonly configService: ConfigService,
	) {
		const apiKey = ENV_KEY.OPENROUTER_API_KEY(this.configService);
		if (!apiKey) {
			throw new InternalServerErrorException(
				"OPENROUTER_API_KEY is not configured",
			);
		}

		this.openrouter = new OpenRouter({ apiKey });
	}

	generateFromTeacherPromptStream(prompt: string): Observable<MessageEvent> {
		return new Observable((subscriber) => {
			(async () => {
				try {
					let buffer = "";
					const stream = await this.openrouter.chat.send({
						chatRequest: {
							model: "openai/gpt-oss-120b",
							messages: [
								{ role: "developer", content: prompts.prompts.developerPrompt },
								{
									role: "user",
									content: prompt + "\n\n" + prompts.prompts.userPrompt,
								},
							],
							stream: true,
						},
					});

					for await (const chunk of stream) {
						const content = chunk.choices[0]?.delta?.content;
						if (content) {
							buffer += content;

							const { completed, rest } =
								this.extractCompletedQuestionObjects(buffer);
							buffer = rest;

							for (const questionObject of completed) {
								const parsedQuestion = this.safeParseJsonObject(questionObject);
								const mappedQuestion =
									this.mapToTeacherPromptResponseDto(parsedQuestion);
								subscriber.next({ data: mappedQuestion } as MessageEvent);
							}
						}
					}

					const { completed: finalCompleted } =
						this.extractCompletedQuestionObjects(buffer, true);
					for (const questionObject of finalCompleted) {
						const parsedQuestion = this.safeParseJsonObject(questionObject);
						const mappedQuestion =
							this.mapToTeacherPromptResponseDto(parsedQuestion);
						subscriber.next({ data: mappedQuestion } as MessageEvent);
					}

					subscriber.next({ data: "[DONE]" } as MessageEvent);
					subscriber.complete();
				} catch (error) {
					console.error("Stream Error:", error);
					subscriber.error(
						new InternalServerErrorException("Lỗi khi stream dữ liệu từ AI"),
					);
				}
			})();
		});
	}

	private extractCompletedQuestionObjects(
		input: string,
		flushAll = false,
	): { completed: string[]; rest: string } {
		const completed: string[] = [];

		let braceDepth = 0;
		let objectStart = -1;
		let inString = false;
		let backslashRun = 0;
		let lastProcessedIndex = -1;

		for (let i = 0; i < input.length; i += 1) {
			const char = input[i];

			if (inString) {
				if (char === "\\") {
					backslashRun += 1;
					continue;
				}

				if (char === '"') {
					if (backslashRun % 2 === 0) {
						inString = false;
					}
					backslashRun = 0;
					continue;
				}

				backslashRun = 0;
				continue;
			}

			if (char === '"') {
				inString = true;
				backslashRun = 0;
				continue;
			}

			if (char === "{") {
				if (braceDepth === 0) {
					objectStart = i;
				}
				braceDepth += 1;
				continue;
			}

			if (char === "}" && braceDepth > 0) {
				braceDepth -= 1;
				if (braceDepth === 0 && objectStart >= 0) {
					const objectText = input.slice(objectStart, i + 1).trim();
					if (objectText) {
						completed.push(objectText);
						lastProcessedIndex = i;
					}
					objectStart = -1;
				}
			}
		}

		if (flushAll) {
			return { completed, rest: "" };
		}

		if (lastProcessedIndex < 0) {
			return { completed, rest: input };
		}

		return {
			completed,
			rest: input.slice(lastProcessedIndex + 1),
		};
	}

	private safeParseJsonObject(text: string): QuestionObject | string {
		try {
			const parsed = JSON.parse(text) as unknown;
			if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
				return parsed as QuestionObject;
			}
			return text;
		} catch {
			return text;
		}
	}

	private mapToTeacherPromptResponseDto(
		parsedQuestion: QuestionObject | string,
	): TeacherPromptResponseDto | string {
		if (typeof parsedQuestion === "string") {
			return parsedQuestion;
		}

		return plainToInstance(
			TeacherPromptResponseDto,
			{
				...parsedQuestion,
				id: Number(parsedQuestion.id),
				questionType: parsedQuestion.question_type,
			},
			{ excludeExtraneousValues: true },
		);
	}
}
