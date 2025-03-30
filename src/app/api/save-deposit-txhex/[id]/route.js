/** @format */

import { NextResponse } from 'next/server';
import { updateLoan } from '@/lib/db/loan';

export async function POST(request, { params }) {
	const { id } = await params;
	const body = await request.json();
	const { deposit_txid } = body;

	console.log('body in save-deposit-txhex ->', body);

	//Get transaction hex based on txid
	const hexRes = await fetch(`https://mempool.space/testnet/api/tx/${deposit_txid}/hex`);
	const deposit_txhex = await hexRes.text();

	console.log('txHex ->', deposit_txhex);

	try {
		const updated = await updateLoan(id, {
			deposit_txhex: deposit_txhex,
			status: 'deposited',
		});
		return NextResponse.json({ success: true, loan: updated });
	} catch (err) {
		return NextResponse.json({ success: false, error: err.message }, { status: 400 });
	}
}
