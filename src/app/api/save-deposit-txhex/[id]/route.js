/** @format */

import { NextResponse } from 'next/server';
import { updateLoan } from '@/lib/db/loan';

export const runtime = 'nodejs'; // ✅ This line forces full Node support

export async function POST(request, { params }) {
	const { id } = await params;
	const body = await request.json();
	const { deposit_txhex } = body;

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
