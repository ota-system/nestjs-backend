import { Injectable, Logger, MessageEvent } from "@nestjs/common";
import { OpenRouter } from "@openrouter/sdk";
import { plainToInstance } from "class-transformer";
import { Observable } from "rxjs";
import { TeacherPromptResponseDto } from "../dtos/teacher-prompt.res.dto";
import { BaseException } from "../exception/base.exception";
import QuestionObject from "../interface/QuestionObject";
import prompts from "./prompts.json";

@Injectable()
export class OpenRouterService {
	constructor(private readonly openrouter: OpenRouter) {}

	generateFromTeacherPromptStream(prompt: string): Observable<MessageEvent> {
		return new Observable((subscriber) => {
			let isCancelled = false;
			let stream:
				| (AsyncIterable<{
						choices?: Array<{ delta?: { content?: string | null } }>;
				  }> & {
						return?: () =>
							| Promise<IteratorResult<unknown>>
							| IteratorResult<unknown>;
				  })
				| undefined;
			void (async () => {
				try {
					let buffer = "";
					stream = await this.openrouter.chat.send({
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

					if (isCancelled || subscriber.closed) {
						await stream.return?.();
						return;
					}

					for await (const chunk of stream) {
						if (isCancelled || subscriber.closed) {
							await stream.return?.();
							return;
						}
						const content = chunk.choices?.[0]?.delta?.content;
						if (content) {
							buffer += content;

							const { completed, rest } =
								this.extractCompletedQuestionObjects(buffer);
							buffer = rest;

							for (const questionObject of completed) {
								if (isCancelled || subscriber.closed) {
									await stream.return?.();
									return;
								}

								const parsedQuestion = this.safeParseJsonObject(questionObject);
								const mappedQuestion =
									this.mapToTeacherPromptResponseDto(parsedQuestion);
								subscriber.next({ data: mappedQuestion } as MessageEvent);
							}
						}
					}

					if (isCancelled || subscriber.closed) {
						return;
					}

					const { completed: finalCompleted } =
						this.extractCompletedQuestionObjects(buffer, true);
					for (const questionObject of finalCompleted) {
						if (isCancelled || subscriber.closed) {
							return;
						}
						const parsedQuestion = this.safeParseJsonObject(questionObject);
						const mappedQuestion =
							this.mapToTeacherPromptResponseDto(parsedQuestion);
						subscriber.next({ data: mappedQuestion } as MessageEvent);
					}

					if (isCancelled || subscriber.closed) {
						return;
					}

					subscriber.next({ data: "[DONE]" } as MessageEvent);
					subscriber.complete();
				} catch (error) {
					Logger.error("Stream Error", error);
					if (!isCancelled && !subscriber.closed) {
						subscriber.error(new BaseException(500, "AI_STREAM_ERROR"));
					}
				}
			})();
			return () => {
				isCancelled = true;
				void stream?.return?.();
			};
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
