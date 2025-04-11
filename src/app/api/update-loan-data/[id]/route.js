/** @format */

import { NextResponse } from 'next/server';
import { updateLoan } from '@/lib/db/loan';
import { addTransaction } from '@/lib/db/transactions';

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

		await addTransaction({
			type: 'collateral_deposited',
			status: 'confirmed',
			amount: updated.btc_collateral,
			currency: 'BTC',
			user_wallet_address: updated.borrower_segwit_address,
			details: {
				loan_id: updated.id,
				txid: deposit_txid,
				from_address: updated.borrower_segwit_address,
				to_address: updated.init_htlc_address,
			},
		});

		return NextResponse.json({ success: true, loan: updated });
	} catch (err) {
		return NextResponse.json({ success: false, error: err.message }, { status: 400 });
	}
}
