/** @format */

import { NextResponse } from 'next/server';
import { ECPairFactory } from 'ecpair';
import * as ecc from '@bitcoinerlab/secp256k1'; // ✅ no wasm fallback
import * as bitcoin from 'bitcoinjs-lib';
import { getLoanById, updateLoan } from '@/lib/db/loan';
import { addTransaction } from '@/lib/db/transactions';
import { broadcastTx } from '@/lib/bitcoin/broadcastTx';

export async function POST(request, { params }) {
	const { id } = await params;
	const body = await request.json();

	try {
		const loanDetails = await getLoanById(id);
		const { init_redeem_script_hex, deposit_txhex, deposit_txid, btc_collateral, borrower_segwit_address, init_timelock } = loanDetails;

		const TESTNET = bitcoin.networks.testnet;
		const ECPair = ECPairFactory(ecc);

		const initRedeemScriptBuffer = Buffer.from(init_redeem_script_hex, 'hex');
		const gasFees = 301;
		const amount = btc_collateral - gasFees;

		const psbt = new bitcoin.Psbt({ network: TESTNET });
		psbt.addInput({
			hash: deposit_txid,
			index: 0,
			sequence: 0xfffffffe,
			nonWitnessUtxo: Buffer.from(deposit_txhex, 'hex'),
			redeemScript: initRedeemScriptBuffer,
		});
		psbt.setLocktime(init_timelock);
		psbt.setInputSequence(0, 0xfffffffe);
		psbt.addOutput({
			address: borrower_segwit_address,
			value: amount,
		});

		const signedPsbt = bitcoin.Psbt.fromHex(body.signed_psbt);
		const inputIndex = 0;
		const partialSig = signedPsbt.data.inputs[inputIndex].partialSig[0].signature;

		psbt.finalizeInput(0, () => {
			const scriptSig = bitcoin.payments.p2sh({
				redeem: {
					output: initRedeemScriptBuffer,
					input: bitcoin.script.compile([partialSig, bitcoin.opcodes.OP_TRUE]),
				},
			});
			return {
				finalScriptSig: scriptSig.input,
			};
		});

		const transactionToHex = psbt.extractTransaction().toHex();
		console.log('Final TX Hex before broadcast:', transactionToHex);

		const txid = await broadcastTx(transactionToHex);
		console.log('Broadcasted TXID →', txid);

		const updated = await updateLoan(id, {
			unlock_collateral_txid: txid,
			status: 'cancelled',
		});

		await addTransaction({
			type: 'loan_cancelled',
			status: 'confirmed',
			amount: updated.loan_amount,
			currency: 'USD',
			user_wallet_address: updated.borrower_segwit_address || null,
			details: { loan_id: updated.id },
		});

		await addTransaction({
			type: 'collateral_redeemed',
			status: 'confirmed',
			amount: amount,
			currency: 'BTC',
			user_wallet_address: updated.borrower_segwit_address || null,
			details: {
				loan_id: updated.id,
				from_address: updated.init_htlc_address,
				to_address: updated.borrower_segwit_address,
				txid: txid,
			},
		});

		return NextResponse.json({ success: true, loan: updated, btc_unlocked: amount, txid: txid });
	} catch (err) {
		console.error('Error in unlocking collateral:', err);
		return NextResponse.json({ success: false, error: err.message }, { status: 400 });
	}
}
