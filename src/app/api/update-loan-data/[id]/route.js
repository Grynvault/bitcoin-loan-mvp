/** @format */

import { NextResponse } from 'next/server';
import { updateLoan } from '@/lib/db/loan';

export async function POST(request, { params }) {
	const { id } = await params;
	const body = await request.json();

	const { deposit_txid } = body;

	console.log('body in update-loan-data ->', body);

	try {
		const updated = await updateLoan(id, {
			deposit_txid: deposit_txid,
			status: 'collateral_deposited',
		});
		return NextResponse.json({ success: true, loan: updated });
	} catch (err) {
		return NextResponse.json({ success: false, error: err.message }, { status: 400 });
	}
}
