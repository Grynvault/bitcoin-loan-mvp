/** @format */

import { NextResponse } from 'next/server';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import * as tools from 'uint8array-tools';
import bip65 from 'bip65';
import crypto from 'crypto';
import { getLoanById } from '@/lib/db/loan';

export async function POST(request) {
	const body = await request.json();
	console.log('body ->', body);

	const { loan_id, tx_id } = body;

	const loanDetails = await getLoanById(loan_id);
	const { btc_collateral, borrower_pub_key, loan_duration, init_preimage, init_redeem_script_hex } = loanDetails;
	console.log('loanDetails ->', loanDetails);

	const TESTNET = bitcoin.networks.testnet; // Testnet
	const ECPair = ECPairFactory(ecc);

	function collateralHashTimelockContract(borrower, lender, locktime, hash) {
		return bitcoin.script.fromASM(
			`
                OP_IF
                    ${tools.toHex(bitcoin.script.number.encode(locktime))}
                    OP_CHECKLOCKTIMEVERIFY
                    OP_DROP
                    ${tools.toHex(lender.publicKey)}
                    OP_CHECKSIG
                OP_ELSE
                    OP_SHA256 
                    ${tools.toHex(hash)} 
                    OP_EQUALVERIFY 
                    ${tools.toHex(borrower.publicKey)} 
                    OP_CHECKSIG
                OP_ENDIF
                `
				.trim()
				.replace(/\s+/g, ' '),
		);
	}

	const borrowerPubkey = borrower_pub_key;
	const borrowerBufferedPrivateKey = Buffer.from(borrowerPubkey.toString('hex'), 'hex');
	const borrower = ECPair.fromPublicKey(borrowerBufferedPrivateKey);

	const grynvaultPrivateKey = process.env.GRYNVAULT_BUFFERED_PRIVATE_KEY;
	const grynvaultBufferedPrivateKey = Buffer.from(grynvaultPrivateKey.toString('hex'), 'hex');
	const grynvault = ECPair.fromPrivateKey(grynvaultBufferedPrivateKey);

	// //For exisiting timestamp
	// // const unixTimestamp = 1742551400;
	// // const lockTime = bip65.encode({ utc: unixTimestamp });

	function utcNow() {
		return Math.floor(Date.now() / 1000);
	}

	//loan_duration is in hours
	const loanDurationInSeconds = loan_duration * 60 * 60;
	const lockTime = bip65.encode({ utc: utcNow() + loanDurationInSeconds });

	// Generate a random 32-byte buffer (preimage)
	const collateralPreimage = crypto.randomBytes(32);
	const collateralPreimageHash = bitcoin.crypto.sha256(collateralPreimage);

	////Creating the Collateral contract address
	const collateralHtlc = collateralHashTimelockContract(borrower, grynvault, lockTime, collateralPreimageHash);
	const { address } = bitcoin.payments.p2sh({
		redeem: {
			output: collateralHtlc,
			network: TESTNET,
		},
		network: TESTNET,
	});

	////Transfering the BTC to Collateral contract address
	const initRedeemScriptBuffer = Buffer.from(init_redeem_script_hex, 'hex');
	const gasFees = 301;
	const amount = btc_collateral - gasFees;

	//Get transaction hex based on txid
	const hexRes = await fetch(`https://mempool.space/testnet/api/tx/${tx_id}/hex`);
	const txHex = await hexRes.text();

	console.log('txHex ->', txHex);

	const bufferedFirstPreimage = Buffer.from(init_preimage);

	/////Creating the transaction
	const psbt = new bitcoin.Psbt({ network: TESTNET });
	psbt.addInput({
		hash: tx_id,
		index: 0,
		nonWitnessUtxo: Buffer.from(txHex, 'hex'),
		redeemScript: initRedeemScriptBuffer,
	});
	psbt.addOutput({
		address: address,
		value: amount,
	});
	psbt.signInput(0, toBufferSigner(grynvault));
	psbt.finalizeInput(0, (index, input) => {
		const sig = input.partialSig[0].signature;
		const scriptSig = bitcoin.payments.p2sh({
			redeem: {
				output: initRedeemScriptBuffer,
				input: bitcoin.script.compile([sig, bufferedFirstPreimage, bitcoin.opcodes.OP_FALSE]),
			},
		});
		return { finalScriptSig: scriptSig.input };
	});

	console.log('Final TX Hex:', psbt.extractTransaction().toHex());

	return NextResponse.json({
		success: true,
		hex_to_be_broadcast: psbt.extractTransaction().toHex(),
		collateralPreimage: collateralPreimage,
	});

	// const bodyToServer = {
	// 	btc_collateral: btc_collateral,
	// 	loan_amount: loan_amount,
	// 	loan_to_value: loan_to_value,
	// 	btc_price: btc_price,
	// 	borrower_pub_key: borrower_pub_key,
	// 	borrower_segwit_address: borrower_segwit_address,
	// 	loan_duration: loan_duration,
	// 	total_loan_withdrawn: 0,
	// 	init_timelock: lockTime,
	// 	init_htlc_address: address,
	// 	init_preimage: firstPreimage,
	// 	status: 'initialize',
	// 	collateral_timelock: null,
	// 	collateral_htlc_address: null,
	// };

	// try {
	// 	const loan = await initiateLoan(bodyToServer);
	// 	return NextResponse.json({
	// 		success: true,
	// 		loan: loan,
	// 	});
	// } catch (err) {
	// 	console.log('err ->', err);
	// 	return NextResponse.json({ success: false, error: err.message }, { status: 500 });
	// }
}

function toBufferSigner(ecpair) {
	return {
		publicKey: Buffer.from(ecpair.publicKey),
		sign: (hash) => {
			const sig = ecpair.sign(hash);
			return Buffer.from(sig);
		},
	};
}
