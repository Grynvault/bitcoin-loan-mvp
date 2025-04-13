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

	console.log('Unsigned PSBT:', psbt.toBase64());

	try {
		return NextResponse.json({ success: true, psbt: psbt.toBase64() });
	} catch (err) {
		return NextResponse.json({ success: false, error: err.message }, { status: 400 });
	}
}
