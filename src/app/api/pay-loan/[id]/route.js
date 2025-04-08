/** @format */

import { NextResponse } from 'next/server';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import * as tools from 'uint8array-tools';
import bip65 from 'bip65';
import { updatePaidLoan, getLoanById } from '@/lib/db/loan';

export async function POST(request, { params }) {
	const { id } = await params;

	const loanDetails = await getLoanById(id);
	console.log('loanDetails ->', loanDetails);

	const { btc_locked, start_loan_txid, borrower_segwit_address, borrower_pub_key, collateral_txhex, collateral_redeem_script_hex, loan_amount } = loanDetails;

	const TESTNET = bitcoin.networks.testnet; // Testnet

	const utxo = {
		txid: start_loan_txid,
		vout: 0,
		value: btc_locked,
	};

	const collateralRedeemScriptBuffer = Buffer.from(collateral_redeem_script_hex, 'hex');
	const gasFees = 800;
	const amount = utxo.value - gasFees;
	console.log('amount ->', amount);

	/////Creating the transaction
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

	console.log('Unsigned PSBT:', psbt.toBase64());

	try {
		const updated = await updatePaidLoan(id, {
			paid_at_timestamp: Math.floor(Date.now() / 1000),
			unsigned_psbt_hex: psbt.toBase64(),
			borrower_pub_key: borrower_pub_key,
			loan_amount: loan_amount,
			status: 'repaid',
		});
		return NextResponse.json({ success: true, loan: updated });
	} catch (err) {
		return NextResponse.json({ success: false, error: err.message }, { status: 400 });
	}
}

/**
 *
 * Data needed
 * - utxo (txid = start_loan_txid, vout = 0, amount = btc_locked (*need to be added to db))
 * - recipientAddress = borrower_segwit_address
 * - gasFees (FIXED)
 * - tx_hex (for nonWitnessUtxo) = collateral_txhex
 * - redeemScript = collateral_redeem_script_hex (need to be added)
 * -
 *
 */
