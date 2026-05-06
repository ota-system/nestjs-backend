export const checkTimesUp = (
	startedAt: Date,
	durationMinutes: number,
): boolean => {
	const endTime = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
	return endTime.getTime() <= Date.now();
};
