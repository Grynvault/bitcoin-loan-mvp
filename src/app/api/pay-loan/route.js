/** @format */

import { NextResponse } from 'next/server';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import * as tools from 'uint8array-tools';
import bip65 from 'bip65';

export async function POST(request, { params }) {
	const { id } = await params;

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
}
