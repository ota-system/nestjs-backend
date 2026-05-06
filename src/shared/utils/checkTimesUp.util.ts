export const checkTimesUp = (
	createdAt: Date,
	durationMinutes: number,
): boolean => {
	const endTime = new Date(createdAt.getTime() + durationMinutes * 60 * 1000);
	const timeoutSeconds = Math.floor((endTime.getTime() - Date.now()) / 1000);
	return timeoutSeconds <= 0;
};
