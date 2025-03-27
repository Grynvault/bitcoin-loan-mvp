/** @format */

export function formatUnix(unixTimestamp) {
	const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	return new Date(unixTimestamp * 1000).toLocaleString('en-US', {
		timeZone: userTimeZone,
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	});
}

export function shortenAddress(addr, start = 5, end = 5) {
	if (!addr || addr.length <= start + end) return addr;
	return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}
