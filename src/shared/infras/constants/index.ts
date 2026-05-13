import { prompts } from "../prompts";

const teacherToolChoice = "required" as const;

const teacherDeveloperPrompt = [
	prompts.developerPrompt.trim(),
	`[GREETING_PROMPT] ${prompts.greetingPrompt}`,
	`[ERROR_PROMPT] ${prompts.errorPrompt}`,
].join("\n\n");

export { teacherDeveloperPrompt, teacherToolChoice };
