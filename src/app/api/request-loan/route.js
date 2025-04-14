/** @format */
'use server';
import { NextResponse } from 'next/server';
const ecc = require('tiny-secp256k1');
const ECPairFactory = require('ecpair').ECPairFactory;
const bitcoin = require('bitcoinjs-lib');
const tools = require('uint8array-tools');
import bip65 from 'bip65';
import crypto from 'crypto';
import { initiateLoan } from '@/lib/db/loan';
import { addTransaction } from '@/lib/db/transactions';

export async function POST(request) {
	const body = await request.json();
	console.log('body ->', body);

	const { btc_collateral, loan_amount, loan_to_value, btc_price, borrower_pub_key, borrower_segwit_address, loan_duration } = body;

	const TESTNET = bitcoin.networks.testnet; // Testnet
	const ECPair = ECPairFactory(ecc);

	function tempHashTimelockContract(borrower, lender, locktime, hash) {
		return bitcoin.script.fromASM(
			`
                OP_IF
                    ${tools.toHex(bitcoin.script.number.encode(locktime))}
                    OP_CHECKLOCKTIMEVERIFY
                    OP_DROP
                    ${tools.toHex(borrower.publicKey)}
                    OP_CHECKSIG
                OP_ELSE
                    OP_SHA256 
                    ${tools.toHex(hash)} 
                    OP_EQUALVERIFY 
                    ${tools.toHex(lender.publicKey)} 
                    OP_CHECKSIG
                OP_ENDIF
                `
				.trim()
				.replace(/\s+/g, ' '),
		);
	}

	//Init borrower account
	const borrowerPubkey = borrower_pub_key;
	const borrowerBufferedPrivateKey = Buffer.from(borrowerPubkey.toString('hex'), 'hex');
	const borrower = ECPair.fromPublicKey(borrowerBufferedPrivateKey);

	const grynvaultPrivateKey = process.env.GRYNVAULT_BUFFERED_PRIVATE_KEY;
	const grynvaultBufferedPrivateKey = Buffer.from(grynvaultPrivateKey.toString('hex'), 'hex');
	const grynvault = ECPair.fromPrivateKey(grynvaultBufferedPrivateKey);

	//For exisiting timestamp
	// const unixTimestamp = 1742551400;
	// const lockTime = bip65.encode({ utc: unixTimestamp });

	function utcNow() {
		return Math.floor(Date.now() / 1000);
	}
	const lockTime = bip65.encode({ utc: utcNow() }); //10 minutes from now

	// Generate a random 32-byte buffer (preimage)
	const firstPreimage = 'secret_for_temporary_htlc';
	const bufferedFirstPreimage = Buffer.from(firstPreimage);
	const firstHash = bitcoin.crypto.sha256(bufferedFirstPreimage);

	////Creating the contract
	const initHtclRedeemScript = tempHashTimelockContract(borrower, grynvault, lockTime, firstHash);
	const { address } = bitcoin.payments.p2sh({
		redeem: {
			output: initHtclRedeemScript,
			network: TESTNET,
		},
		network: TESTNET,
	});

	console.log('initHtclRedeemScript ->', initHtclRedeemScript);

	const bodyToServer = {
		btc_collateral: btc_collateral,
		loan_amount: loan_amount,
		loan_to_value: loan_to_value,
		btc_price: btc_price,
		borrower_pub_key: borrower_pub_key,
		borrower_segwit_address: borrower_segwit_address,
		loan_duration: loan_duration,
		total_loan_withdrawn: 0,
		init_timelock: lockTime,
		init_htlc_address: address,
		init_preimage: firstPreimage,
		status: 'collateral_pending',
		collateral_timelock: null,
		collateral_htlc_address: null,
		init_redeem_script_hex: initHtclRedeemScript.toString('hex'),
	};

	try {
		const loan = await initiateLoan(bodyToServer);

		await addTransaction({
			type: 'loan_initiated',
			status: 'confirmed',
			amount: loan.loan_amount,
			currency: 'USD',
			user_wallet_address: loan.borrower_segwit_address,
			details: {
				loan_id: loan.id,
			},
		});

		return NextResponse.json({
			success: true,
			loan: loan,
		});
	} catch (err) {
		console.log('err ->', err);
		return NextResponse.json({ success: false, error: err.message }, { status: 500 });
	}
}
