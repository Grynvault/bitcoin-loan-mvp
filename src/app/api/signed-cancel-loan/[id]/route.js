/** @format */

import { NextResponse } from 'next/server';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import * as tools from 'uint8array-tools';
import bip65 from 'bip65';
import { getLoanById, updateLoan, startLoan } from '@/lib/db/loan';
import { addTransaction } from '@/lib/db/transactions';
import { broadcastTx } from '@/lib/bitcoin/broadcastTx';

export async function POST(request, { params }) {
	const { id } = await params;
	const body = await request.json();
	console.log('body ->', body);

	const loanDetails = await getLoanById(id);
	const { init_redeem_script_hex, deposit_txhex, deposit_txid, btc_collateral, borrower_segwit_address, init_timelock } = loanDetails;
	console.log('loanDetails ->', loanDetails);

	const TESTNET = bitcoin.networks.testnet; // Testnet
	const ECPair = ECPairFactory(ecc);

	////Transfering the BTC back to Borrower's address
	const initRedeemScriptBuffer = Buffer.from(init_redeem_script_hex, 'hex');
	const gasFees = 301;
	const amount = btc_collateral - gasFees;

	/////Creating the transaction
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

	console.log('Extracted partial signature:', partialSig.toString('hex'));

	psbt.finalizeInput(0, (inputIndex, input) => {
		const scriptSig = bitcoin.payments.p2sh({
			redeem: { output: initRedeemScriptBuffer, input: bitcoin.script.compile([partialSig, bitcoin.opcodes.OP_TRUE]) },
		});
		return {
			finalScriptSig: scriptSig.input, // Manually set the scriptSig
		};
	});

	const transactionToHex = psbt.extractTransaction().toHex();

	console.log('Final TX Hex before broadcast:', transactionToHex);
	const txid = await broadcastTx(transactionToHex);
	console.log('Broadcasted TXID →', txid);

	try {
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
			details: {
				loan_id: updated.id,
			},
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

		return NextResponse.json({
			success: true,
			loan: updated,
		});
	} catch (err) {
		return NextResponse.json({ success: false, error: err.message }, { status: 400 });
	}
}
