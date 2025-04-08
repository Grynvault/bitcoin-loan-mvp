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
		hour12: true,
	});
}

export function formatUsd(usd) {
	return (usd / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function getTimeLeft(futureUnix) {
	const now = Math.floor(Date.now() / 1000); // current time in seconds
	const secondsLeft = futureUnix - now;

	if (secondsLeft <= 0) return 'Expired';

	const days = Math.floor(secondsLeft / 86400);
	const hours = Math.floor((secondsLeft % 86400) / 3600);
	const minutes = Math.floor((secondsLeft % 3600) / 60);

	return `${days}d ${hours}h ${minutes}m left`;
}

export function shortenAddress(addr, start = 5, end = 5) {
	if (!addr || addr.length <= start + end) return addr;
	return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}
