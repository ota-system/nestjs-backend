export type SubmitTestAnswer = {
	questionId: string;
	optionId?: string;
	answer?: string;
	isCorrect: boolean;
};

export type TestFraudResult = {
	type: FraudType;
	times: number;
};

export enum FraudType {
	VISIBILITY_CHANGE = "VISIBILITY CHANGE",
	FULLSCREEN_EXIT = "FULLSCREEN EXIT",
}

export type TestFraudCache = {
	type: FraudType;
	times: number;
};
