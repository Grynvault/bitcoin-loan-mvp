/** @format */

import { NextResponse } from 'next/server';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import * as tools from 'uint8array-tools';
import bip65 from 'bip65';

export async function POST(request) {
	const body = await request.json();
	console.log('Received pubKey:', body.pubkey);

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
	const borrowerPubkey = body.pubkey;
	const borrowerBufferedPrivateKey = Buffer.from(borrowerPubkey.toString('hex'), 'hex');
	const borrower = ECPair.fromPublicKey(borrowerBufferedPrivateKey);

	const grynvaultPrivateKey = process.env.GRYNVAULT_BUFFERED_PRIVATE_KEY;
	const grynvaultBufferedPrivateKey = Buffer.from(grynvaultPrivateKey.toString('hex'), 'hex');
	const grynvault = ECPair.fromPrivateKey(grynvaultBufferedPrivateKey);

	function utcNow() {
		return Math.floor(Date.now() / 1000);
	}

	const unixTimestamp = 1742551400;
	//Locktime
	const lockTime = bip65.encode({ utc: unixTimestamp });

	//Hash
	const firstPreimage = Buffer.from('secret_for_temporary_htlc');
	const firstHash = bitcoin.crypto.sha256(firstPreimage);

	////Creating the contract
	const initHtclRedeemScript = tempHashTimelockContract(borrower, grynvault, lockTime, firstHash);
	const { address } = bitcoin.payments.p2sh({
		redeem: {
			output: initHtclRedeemScript,
			network: TESTNET,
		},
		network: TESTNET,
	});

	console.log('Init HTCL Redeem address ->', address);

	return NextResponse.json({
		success: true,
		tempHtclAdress: address,
	});
}
