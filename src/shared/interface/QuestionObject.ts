import { QuestionType } from "../types/question-type.enum";

export enum Difficulty {
	EASY = "easy",
	MEDIUM = "medium",
	HARD = "hard",
}

interface QuestionObject {
	id: string;
	question: string;
	topic: string;
	difficulty: Difficulty;
	options: string[];
	question_type: QuestionType;
	answer: string;
	explanation: string;
}

export default QuestionObject;
