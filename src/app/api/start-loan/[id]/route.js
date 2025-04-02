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

	// const loanDetails = await getLoanById(id);
	// const { btc_collateral, loan_amount, borrower_pub_key, loan_duration, init_preimage, init_redeem_script_hex, deposit_txid, deposit_txhex } = loanDetails;
	// console.log('loanDetails ->', loanDetails);

	// const TESTNET = bitcoin.networks.testnet; // Testnet
	// const ECPair = ECPairFactory(ecc);

	// function collateralHashTimelockContract(borrower, lender, locktime, hash) {
	// 	return bitcoin.script.fromASM(
	// 		`
	//             OP_IF
	//                 ${tools.toHex(bitcoin.script.number.encode(locktime))}
	//                 OP_CHECKLOCKTIMEVERIFY
	//                 OP_DROP
	//                 ${tools.toHex(lender.publicKey)}
	//                 OP_CHECKSIG
	//             OP_ELSE
	//                 OP_SHA256
	//                 ${tools.toHex(hash)}
	//                 OP_EQUALVERIFY
	//                 ${tools.toHex(borrower.publicKey)}
	//                 OP_CHECKSIG
	//             OP_ENDIF
	//             `
	// 			.trim()
	// 			.replace(/\s+/g, ' '),
	// 	);
	// }

	// const borrowerPubkey = borrower_pub_key;
	// const borrowerBufferedPrivateKey = Buffer.from(borrowerPubkey.toString('hex'), 'hex');
	// const borrower = ECPair.fromPublicKey(borrowerBufferedPrivateKey);

	// const grynvaultPrivateKey = process.env.GRYNVAULT_BUFFERED_PRIVATE_KEY;
	// const grynvaultBufferedPrivateKey = Buffer.from(grynvaultPrivateKey.toString('hex'), 'hex');
	// const grynvault = ECPair.fromPrivateKey(grynvaultBufferedPrivateKey);

	// // //For exisiting timestamp
	// // // const unixTimestamp = 1742551400;
	// // // const lockTime = bip65.encode({ utc: unixTimestamp });

	// function utcNow() {
	// 	return Math.floor(Date.now() / 1000);
	// }

	// //loan_duration is in hours
	// const loanDurationInSeconds = loan_duration * 60 * 60;
	// const lockTime = bip65.encode({ utc: utcNow() + loanDurationInSeconds });

	// // Generate a random 32-byte buffer (preimage)
	// const collateralPreimage = 'secrect_for_collateral_htlc';
	// const bufferedCollateralPreimage = Buffer.from(collateralPreimage);
	// const collateralPreimageHash = bitcoin.crypto.sha256(bufferedCollateralPreimage);

	// ////Creating the Collateral contract address
	// const collateralHtlc = collateralHashTimelockContract(borrower, grynvault, lockTime, collateralPreimageHash);
	// const { address } = bitcoin.payments.p2sh({
	// 	redeem: {
	// 		output: collateralHtlc,
	// 		network: TESTNET,
	// 	},
	// 	network: TESTNET,
	// });

	// ////Transfering the BTC to Collateral contract address
	// const initRedeemScriptBuffer = Buffer.from(init_redeem_script_hex, 'hex');
	// const gasFees = 301;
	// const amount = btc_collateral - gasFees;

	// const bufferedFirstPreimage = Buffer.from(init_preimage);

	// /////Creating the transaction
	// const psbt = new bitcoin.Psbt({ network: TESTNET });
	// psbt.addInput({
	// 	hash: deposit_txid,
	// 	index: 0,
	// 	nonWitnessUtxo: Buffer.from(deposit_txhex, 'hex'),
	// 	redeemScript: initRedeemScriptBuffer,
	// });
	// psbt.addOutput({
	// 	address: address,
	// 	value: amount,
	// });
	// psbt.signInput(0, toBufferSigner(grynvault));
	// psbt.finalizeInput(0, (index, input) => {
	// 	const sig = input.partialSig[0].signature;
	// 	const scriptSig = bitcoin.payments.p2sh({
	// 		redeem: {
	// 			output: initRedeemScriptBuffer,
	// 			input: bitcoin.script.compile([sig, bufferedFirstPreimage, bitcoin.opcodes.OP_FALSE]),
	// 		},
	// 	});
	// 	return { finalScriptSig: scriptSig.input };
	// });

	// const transactionToHex = psbt.extractTransaction().toHex();

	// console.log('Final TX Hex before broadcast:', transactionToHex);
	// const txid = await broadcastTx(transactionToHex);
	// console.log('Broadcasted TXID →', txid);

	// const bodyToServer = {
	// 	loan_duration: loan_duration,
	// 	total_loan_withdrawn: 0,
	// 	init_timelock: lockTime,
	// 	init_htlc_address: address,
	// 	status: 'finalized',
	// 	collateral_timelock: lockTime,
	// 	collateral_htlc_address: address,
	// 	collateral_preimage: collateralPreimage,
	// 	collateral_txhex: transactionToHex,
	// 	loan_amount: loan_amount,
	// 	borrower_pub_key: borrower_pub_key,
	// 	start_loan_txid: txid,
	// };

	const bodyToServer = {
		loan_duration: 2,
		total_loan_withdrawn: 0,
		init_timelock: 1743591807,
		init_htlc_address: '2N2Ty1xd66yFyConUp2gFXvV78a3hi5heuA',
		status: 'finalized',
		collateral_timelock: 1743591807,
		collateral_htlc_address: '2N2Ty1xd66yFyConUp2gFXvV78a3hi5heuA',
		collateral_preimage: 'secrect_for_collateral_htlc',
		collateral_txhex:
			'0200000001d1384319a8b7517faaa647e6177404b258da3a9d9ee44d9d7306ea188e6da86b00000000d84730440220241656faf21d24a36c9aa67dd7bd5f19d6a0bbb93f30c4c40c85c5e4fb997f86022041c28b2d0bfe20f11e55dcbb63249dc9bade1dac6f4132b56259f83c6c37b1d801197365637265745f666f725f74656d706f726172795f68746c63004c736304a4ffec67b1752102ddc59466da05af6e1d64d5009cfd1069bc1e8dba743ac4616875ff71f81e9758ac67a8207817ded1e17cd65a5ce3c678bfce2461213b43272c4b77426558c6fe8f3726c58821036617e61ead19cf1697fb4a1081f640c5b335cdbb3a6e6c8ad4dcd55c37193052ac68ffffffff01be4000000000000017a91465220ad4ab037b99dbd56b3f72867b440b08ddaa8700000000',
		loan_amount: 1000,
		borrower_pub_key: '02ddc59466da05af6e1d64d5009cfd1069bc1e8dba743ac4616875ff71f81e9758',
		start_loan_txid: 'f6c749e477a7dc29e8185f7c884f7d9e834128dea632ad2cecdd2fdda85d5470',
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
