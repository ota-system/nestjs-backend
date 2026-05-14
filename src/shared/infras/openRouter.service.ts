import { Injectable, MessageEvent } from "@nestjs/common";
import { OpenRouter } from "@openrouter/sdk";
import { plainToInstance } from "class-transformer";
import { Observable } from "rxjs";
import { TeacherPromptResponseDto } from "../dtos/teacher-prompt.res.dto";
import { BaseException } from "../exception/base.exception";
import { teacherDeveloperPrompt } from "./constants";
import { teacherErrorTool } from "./constants/teacher-error-tool";
import TeacherExceptionSchema from "./schema/teacher-exception.schema";
import TeacherQuestionSchema from "./schema/teacher-question.schema";
import type { TeacherPromptError } from "./types/teacher-prompt-error.type";
import type { TeacherQuestion } from "./types/teacher-question.type";

const teacherTools = [teacherErrorTool];

@Injectable()
export class OpenRouterService {
	constructor(private readonly openrouter: OpenRouter) {}

	generateFromTeacherPromptStream(prompt: string): Observable<MessageEvent> {
		return new Observable((subscriber) => {
			let isCancelled = false;
			let sawToolCall = false;
			let emittedQuestionsCount = 0;
			let stream:
				| (AsyncIterable<{
						choices?: Array<{
							delta?: {
								content?: string | null;
								toolCalls?: Array<{
									index: number;
									id?: string;
									type?: string;
									function?: {
										name?: string;
										arguments?: string;
									};
								}>;
							};
							finishReason?: string | null;
						}>;
				  }> & {
						return?: () =>
							| Promise<IteratorResult<unknown>>
							| IteratorResult<unknown>;
				  })
				| undefined;

			const pendingToolCalls = new Map<
				number,
				{ id?: string; name?: string; arguments: string }
			>();

			void (async () => {
				try {
					let buffer = "";
					stream = await this.openrouter.chat.send({
						chatRequest: {
							model: "openai/gpt-oss-120b",
							messages: [
								{ role: "developer", content: teacherDeveloperPrompt },
								{ role: "user", content: prompt },
							],
							tools: teacherTools,
							parallelToolCalls: true,
							stream: true,
						},
					});

					for await (const chunk of stream) {
						if (isCancelled || subscriber.closed) {
							await stream.return?.();
							return;
						}

						const choice = chunk.choices?.[0];
						const delta = choice?.delta;

						if (delta?.toolCalls?.length) {
							sawToolCall = true;
							this.mergeToolCallDeltas(pendingToolCalls, delta.toolCalls);
						}

						if (!sawToolCall && delta?.content) {
							buffer += delta.content;
							const { completed, rest } =
								this.extractCompletedQuestionObjects(buffer);
							buffer = rest;

							for (const questionObject of completed) {
								const emitRes = this.emitStructuredPayload(
									questionObject,
									subscriber,
								);
								if (emitRes === "question") emittedQuestionsCount += 1;
								if (emitRes === "error") {
									subscriber.next({ data: "[DONE]" } as MessageEvent);
									subscriber.complete();
									await stream.return?.();
									return;
								}
							}
						}
					}

					if (isCancelled || subscriber.closed) return;

					const finalFlush = this.flushPendingToolCalls(
						pendingToolCalls,
						subscriber,
					);
					if (finalFlush.questions)
						emittedQuestionsCount += finalFlush.questions;
					if (finalFlush.error) {
						subscriber.next({ data: "[DONE]" } as MessageEvent);
						subscriber.complete();
						return;
					}

					const { completed: finalCompleted } =
						this.extractCompletedQuestionObjects(buffer, true);
					for (const questionObject of finalCompleted) {
						const emitRes = this.emitStructuredPayload(
							questionObject,
							subscriber,
						);
						if (emitRes === "question") emittedQuestionsCount += 1;
						if (emitRes === "error") {
							subscriber.next({ data: "[DONE]" } as MessageEvent);
							subscriber.complete();
							return;
						}
					}

					if (emittedQuestionsCount === 0) {
						throw new BaseException(500, "AI_STREAM_ERROR");
					}

					subscriber.next({ data: "[DONE]" } as MessageEvent);
					subscriber.complete();
				} catch (error) {
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

	private mergeToolCallDeltas(
		pendingToolCalls: Map<
			number,
			{
				id?: string;
				name?: string;
				arguments: string;
			}
		>,
		toolCalls: Array<{
			index: number;
			id?: string;
			type?: string;
			function?: {
				name?: string;
				arguments?: string;
			};
		}>,
	): void {
		for (const toolCall of toolCalls) {
			const currentToolCall =
				pendingToolCalls.get(toolCall.index) ??
				({ arguments: "" } as {
					id?: string;
					name?: string;
					arguments: string;
				});

			if (toolCall.id) {
				currentToolCall.id = toolCall.id;
			}

			if (toolCall.function?.name) {
				currentToolCall.name = toolCall.function.name;
			}

			if (toolCall.function?.arguments) {
				currentToolCall.arguments += toolCall.function.arguments;
			}

			pendingToolCalls.set(toolCall.index, currentToolCall);
		}
	}

	private flushPendingToolCalls(
		pendingToolCalls: Map<
			number,
			{
				id?: string;
				name?: string;
				arguments: string;
			}
		>,
		subscriber: { next: (value: MessageEvent) => void },
	): { emitted: boolean; questions: number; error: boolean } {
		if (!pendingToolCalls.size) {
			return { emitted: false, questions: 0, error: false };
		}

		let emitted = false;
		let questions = 0;
		let error = false;
		const orderedToolCalls = [...pendingToolCalls.entries()].sort(
			([leftIndex], [rightIndex]) => leftIndex - rightIndex,
		);
		pendingToolCalls.clear();

		for (const [, toolCall] of orderedToolCalls) {
			const res = this.emitStructuredPayload(toolCall.arguments, subscriber);
			if (res === "question") {
				emitted = true;
				questions += 1;
			} else if (res === "error") {
				emitted = true;
				error = true;
			}
		}

		return { emitted, questions, error };
	}

	private emitStructuredPayload(
		payload: unknown,
		subscriber: { next: (value: MessageEvent) => void },
	): "question" | "error" | false {
		const normalizedPayload =
			typeof payload === "string" ? this.safeParseJsonObject(payload) : payload;

		const questionResult = TeacherQuestionSchema.safeParse(normalizedPayload);
		if (questionResult.success) {
			subscriber.next({
				data: this.mapToTeacherPromptResponseDto(questionResult.data),
			} as MessageEvent);
			return "question";
		}

		const errorResult = TeacherExceptionSchema.safeParse(normalizedPayload);
		if (errorResult.success) {
			const errorPayload: TeacherPromptError = errorResult.data;
			subscriber.next({ data: errorPayload } as MessageEvent);
			return "error";
		}

		return false;
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

	private safeParseJsonObject(text: string): unknown {
		try {
			return JSON.parse(text) as unknown;
		} catch {
			return text;
		}
	}

	private mapToTeacherPromptResponseDto(
		parsedQuestion: TeacherQuestion,
	): TeacherPromptResponseDto {
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
