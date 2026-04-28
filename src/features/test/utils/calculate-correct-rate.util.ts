const calculateCorrectRate = (correct: number, totalQuestions: number) => {
	const rate = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
	return Math.round(rate * 100) / 100;
};

export default calculateCorrectRate;
