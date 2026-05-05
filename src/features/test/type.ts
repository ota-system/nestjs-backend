export type SubmitTestAnswer = {
	questionId: string;
	optionId?: string;
	answer?: string;
	isCorrect: boolean;
};
