export enum QuestionType {
	MULTIPLE_CHOICE = "multiple_choice",
	TRUE_FALSE = "true_false",
	FILL_IN_THE_BLANK = "fill_in_the_blank",
}

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
