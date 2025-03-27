/** @format */

import { NextResponse } from 'next/server';
import { updateLoan } from '@/lib/db/loan';

export async function PATCH(request, { params }) {
	const { id } = await params;
	const body = await request.json();

	console.log('body in update-loan-data ->', body);

	try {
		const updated = await updateLoan(id, body);
		return NextResponse.json({ success: true, loan: updated });
	} catch (err) {
		return NextResponse.json({ success: false, error: err.message }, { status: 400 });
	}
}
