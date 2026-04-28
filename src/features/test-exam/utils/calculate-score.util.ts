const calculateScore = (correct: number, totalQuestions: number) => {
	const score = totalQuestions > 0 ? (correct / totalQuestions) * 10 : 0;
	return Math.round(score * 100) / 100;
};

export default calculateScore;
