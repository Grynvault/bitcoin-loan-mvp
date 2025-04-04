/** @format */

import { NextResponse } from 'next/server';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import * as tools from 'uint8array-tools';
import bip65 from 'bip65';
import { getLoanById, updateLoan, startLoan } from '@/lib/db/loan';
import { broadcastTx } from '@/lib/bitcoin/broadcastTx';

export async function POST(request, { params }) {
	const { id } = await params;

	const loanDetails = await getLoanById(id);
	const { btc_collateral, loan_amount, borrower_pub_key, loan_duration, init_preimage, init_redeem_script_hex, deposit_txid, deposit_txhex } = loanDetails;
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
	const collateralPreimage = 'secrect_for_collateral_htlc';
	const bufferedCollateralPreimage = Buffer.from(collateralPreimage);
	const collateralPreimageHash = bitcoin.crypto.sha256(bufferedCollateralPreimage);

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

	const bufferedFirstPreimage = Buffer.from(init_preimage);

	/////Creating the transaction
	const psbt = new bitcoin.Psbt({ network: TESTNET });
	psbt.addInput({
		hash: deposit_txid,
		index: 0,
		nonWitnessUtxo: Buffer.from(deposit_txhex, 'hex'),
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

	const transactionToHex = psbt.extractTransaction().toHex();

	console.log('Final TX Hex before broadcast:', transactionToHex);
	const txid = await broadcastTx(transactionToHex);
	console.log('Broadcasted TXID →', txid);

	const bodyToServer = {
		loan_duration: loan_duration,
		total_loan_withdrawn: 0,
		init_htlc_address: address,
		status: 'active',
		collateral_timelock: lockTime,
		collateral_htlc_address: address,
		collateral_preimage: collateralPreimage,
		collateral_txhex: transactionToHex,
		loan_amount: loan_amount,
		borrower_pub_key: borrower_pub_key,
		start_loan_txid: txid,
		btc_locked: amount,
		collateral_redeem_script_hex: collateralHtlc.toString('hex'),
	};

	try {
		const updated = await startLoan(id, bodyToServer);
		return NextResponse.json({
			success: true,
			body: { ...updated, txid: txid },
		});
	} catch (err) {
		return NextResponse.json({ success: false, error: err.message }, { status: 400 });
	}
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

// Fake body
// const bodyToServer = {
// 	loan_duration: 3,
// 	total_loan_withdrawn: 0,
// 	init_htlc_address: '2MvmeE6Xk5qUSAGPR5h4tVVqFFYZ4GborAZ',
// 	status: 'active',
// 	collateral_timelock: 1743794760,
// 	collateral_htlc_address: '2MvmeE6Xk5qUSAGPR5h4tVVqFFYZ4GborAZ',
// 	collateral_preimage: 'secrect_for_collateral_htlc',
// 	collateral_txhex:
// 		'0200000001d7b1a7b5e390232d0dc30049e99f86a58971856c2bd4f309dd72fbda07cffa3a00000000d9483045022100cdc0ce1e678496a607a45befc83b03fb758f4df455356cdd6ce2a0ff454749d6022044fd8147c7af0982c8e31ed214d13cee9a25b9584cc1e9fe4291bd71dde45cf701197365637265745f666f725f74656d706f726172795f68746c63004c736304580af067b17521036617e61ead19cf1697fb4a1081f640c5b335cdbb3a6e6c8ad4dcd55c37193052ac67a8207817ded1e17cd65a5ce3c678bfce2461213b43272c4b77426558c6fe8f3726c58821036617e61ead19cf1697fb4a1081f640c5b335cdbb3a6e6c8ad4dcd55c37193052ac68ffffffff01394200000000000017a91426a916d4efbd2edda3fe3d81377d970698e598e28700000000',
// 	loan_amount: 1000,
// 	borrower_pub_key: '036617e61ead19cf1697fb4a1081f640c5b335cdbb3a6e6c8ad4dcd55c37193052',
// 	start_loan_txid: 'ff740bc4f1393d6d5ddadda551f57ec388957a9b42233167c2419580b99fb6c3',
// 	btc_locked: 16953,
// 	collateral_redeem_script_hex:
// 		'63044832f067b17521036617e61ead19cf1697fb4a1081f640c5b335cdbb3a6e6c8ad4dcd55c37193052ac67a82074c972a2689bd011b990a879aecc18dd5b979acba9146e68a34f0e96f2e173278821036617e61ead19cf1697fb4a1081f640c5b335cdbb3a6e6c8ad4dcd55c37193052ac68',
// };
