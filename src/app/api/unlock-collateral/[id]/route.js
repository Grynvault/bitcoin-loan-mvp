/** @format */

import { NextResponse } from 'next/server';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import * as tools from 'uint8array-tools';
import bip65 from 'bip65';
import { getLoanById, updateLoan } from '@/lib/db/loan';
import { broadcastTx } from '@/lib/bitcoin/broadcastTx';

//body: { signed_psbt }
export async function POST(request, { params }) {
	const { id } = await params;
	const body = await request.json();
	console.log('body ->', body);

	const loanDetails = await getLoanById(id);
	console.log('loanDetails ->', loanDetails);
	const { btc_locked, start_loan_txid, borrower_segwit_address, collateral_txhex, collateral_redeem_script_hex, collateral_preimage } = loanDetails;

	const TESTNET = bitcoin.networks.testnet; // Testnet

	const utxo = {
		txid: start_loan_txid,
		vout: 0,
		value: btc_locked,
	};

	const collateralRedeemScriptBuffer = Buffer.from(collateral_redeem_script_hex, 'hex');
	const collateralPreimage = Buffer.from(collateral_preimage);
	const gasFees = 800;
	const amount = utxo.value - gasFees;
	console.log('amount ->', amount);

	const psbt = new bitcoin.Psbt({ network: TESTNET });
	psbt.addInput({
		hash: start_loan_txid,
		index: 0,
		nonWitnessUtxo: Buffer.from(collateral_txhex, 'hex'),
		redeemScript: collateralRedeemScriptBuffer,
	});
	psbt.addOutput({
		address: borrower_segwit_address,
		value: amount, // Amount to send (in sats)
	});

	const signedPsbt = bitcoin.Psbt.fromHex(body.signed_psbt);
	const inputIndex = 0;
	const partialSig = signedPsbt.data.inputs[inputIndex].partialSig[0].signature;

	console.log('Extracted partial signature:', partialSig.toString('hex'));

	psbt.finalizeInput(0, (inputIndex, input) => {
		const scriptSig = bitcoin.payments.p2sh({
			redeem: { output: collateralRedeemScriptBuffer, input: bitcoin.script.compile([partialSig, collateralPreimage, bitcoin.opcodes.OP_FALSE]) },
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
			status: 'repaid',
		});

		return NextResponse.json({
			success: true,
			loan: updated,
		});
	} catch (err) {
		return NextResponse.json({ success: false, error: err.message }, { status: 400 });
	}
}
