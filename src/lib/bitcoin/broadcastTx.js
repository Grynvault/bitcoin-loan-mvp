/** @format */

const endpoints = ['https://blockstream.info/testnet/api/tx', 'https://mempool.space/testnet/api/tx'];

export async function broadcastTx(txHex) {
	if (!txHex || typeof txHex !== 'string') {
		throw new Error('Invalid transaction hex');
	}

	for (const url of endpoints) {
		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'text/plain' },
				body: txHex,
			});
			const result = await res.text();
			if (res.ok) return result; // txid
			console.warn(`Failed at ${url}:`, result);
		} catch (err) {
			console.warn(`Error at ${url}:`, err.message);
		}
	}

	throw new Error('All broadcast attempts failed');
}
