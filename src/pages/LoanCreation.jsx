/** @format */
'use client';
import React, { useState } from 'react';
//MUI import
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

const btcPrice = 83000;
const initializeHtlc = '2MtJv6jsyok1tjrLRkDJtXPYuB414heoqLU';
const unsignedGetBackCollateral =
	'cHNidP8BAFICAAAAAUdJzG32JFoqs6N8Sr5w2ADAmrwcTbcLkbN1/TwDt0x8AAAAAAD+////AblhAAAAAAAAFgAUjLaTReNt0fndhG+WtZfjVroouMqgON1nAAEA3wIAAAAAAQFHgdtGXGZBaEaeQnyIRKdSPtdoVMGWvz9gEN9zVUlZIgEAAAAA/////wLZZAAAAAAAABepFAuq215DDEjPsQm9XPUSN9IFS6Irh8mwAQAAAAAAFgAUjLaTReNt0fndhG+WtZfjVroouMoCRzBEAiB/E67oFpH9wxvpjDizWCYTAzs16KfYT5vta5ao1a1dAwIgKrwzs06UvN/AEGCA0QRLgI3DQ8wXgUkIXZVuIw1rAz0BIQLdxZRm2gWvbh1k1QCc/RBpvB6NunQ6xGFodf9x+B6XWAAAAAABBHNjBKA43WexdSEC3cWUZtoFr24dZNUAnP0Qabwejbp0OsRhaHX/cfgel1isZ6ggeBfe0eF81lpc48Z4v84kYSE7QycsS3dCZVjG/o83JsWIIQNmF+YerRnPFpf7ShCB9kDFszXNuzpubIrU3NVcNxkwUqxoAAA=';
const borrowerNativeSegwitAccount = 'tb1q3jmfx30rdhglnhvyd7ttt9lr26az3wx26e2hqc';

const connectUnisat = async () => {
	if (!window.unisat) {
		alert('Please install the Unisat Wallet extension.');
		return;
	}
	try {
		const accounts = await window.unisat.requestAccounts();
		return accounts[0];
	} catch (error) {
		console.error('Connection error:', error);
	}
};

const getPublicKey = async () => {
	try {
		let res = await window.unisat.getPublicKey();
		console.log(res);
		return res;
	} catch (e) {
		console.log(e);
	}
};

function LoanCreation({ account, step, setStep }) {
	const [loanAmount, setLoanAmount] = useState(100);
	const [loanDuration, setLoanDuration] = useState('');
	const [loanDetails, setLoanDetails] = useState(null);
	const [transactionDetails, setTransactionDetails] = useState(null);

	const requestLoan = async () => {
		const account = connectUnisat();
		console.log('account ->', account);

		const pubKey = await getPublicKey();

		setLoanDetails({
			loanAmount: loanAmount,
			collateral: (loanAmount * (10 / 7)) / btcPrice,
			loanDuration: loanDuration,
			pubKey: pubKey,
		});

		const res = await fetch('/api/btc-tx', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				pubkey: pubKey,
			}),
		});

		const data = await res.json();
		console.log(data);
	};

	const nextStep = () => {
		setStep((pre) => pre + 1);
	};

	const onChangeCollateral = () => {
		const collateral = (loanAmount * (10 / 7)) / btcPrice;
		return collateral;
	};

	const fundInitialCollateral = async () => {
		const collateralInSatoshis = parseInt(100000000 * ((loanAmount * (10 / 7)) / btcPrice));

		try {
			let txid = await window.unisat.sendBitcoin(initializeHtlc, collateralInSatoshis);
			console.log(txid);
			setTransactionDetails(txid);
		} catch (e) {
			console.log(e);
		}
	};

	const signToGetBackCollateral = async () => {
		try {
			let res = await window.unisat.signPsbt(unsignedGetBackCollateral, {
				autoFinalized: false,
				toSignInputs: [
					{
						index: 0,
						address: borrowerNativeSegwitAccount,
					},
				],
			});

			console.log('res =', res);
		} catch (error) {
			console.log('Error', error);
		}
	};

	const sendMessage = async () => {};

	return (
		<div className='w-full text-start'>
			{step === 1 && (
				<div className='w-full text-start'>
					<div className='py-4'>Step #1: Request Loan</div>
					<CardComponent>
						<div className='flex flex-col gap-4'>
							<div className='flex flex-row gap-2 items-center'>
								Loan Amount: ${' '}
								<TextField
									id='standard-basic'
									label=''
									variant='standard'
									placeholder='100'
									value={loanAmount}
									onChange={(e) => setLoanAmount(e.target.value)}
								/>
							</div>
							<div>
								<div className='flex flex-row gap-2 items-center'>
									Collateral (LTV: 70%):{'  '}
									{onChangeCollateral().toFixed(8)} BTC
								</div>
								<div className='text-xs'>(1 BTC = $83,000)</div>
							</div>

							<div className='flex flex-row gap-2 items-center'>
								Duration:
								<TextField
									id='standard-basic'
									label=''
									variant='standard'
									placeholder='5'
									value={loanDuration}
									onChange={(e) => setLoanDuration(e.target.value)}
								/>
								hours
							</div>
							<div className='flex flex-row gap-2 items-center'>Fees: 0 BTC</div>
							<Button
								onClick={requestLoan}
								variant='contained'>
								Request Loan
							</Button>
							<Button onClick={sendMessage}>Send Message</Button>
						</div>
					</CardComponent>
					{loanDetails && (
						<div className='border p-4 mt-4'>
							<div>Loan Amount: {loanDetails.loanAmount}</div>
							<div>Collateral: {loanDetails.collateral.toFixed(8)} BTC</div>
							<div>Timelock: 30 minutes</div>
							<div>Loan Duration: {loanDetails.loanDuration} hours</div>
							<div>Borrower's Pubkey: {loanDetails.pubKey}</div>
							<Button
								variant='outlined'
								onClick={nextStep}>
								Next
							</Button>
						</div>
					)}
				</div>
			)}

			{step === 2 && (
				<div className='w-full text-start'>
					<div className='py-4'>Step #2: Fund Collateral</div>
					<CardComponent>
						<div className='w-full flex flex-col gap-4'>
							<div className='text-center'>
								Fund the BTC Collateral to <br /> Hash Time-lock Contract
								<Accordion>
									<AccordionSummary
										expandIcon={<>V</>}
										aria-controls='panel1-content'
										id='panel1-header'>
										<div>P2SH Address: {initializeHtlc}</div>
									</AccordionSummary>
									<AccordionDetails>{`
                                        OP_IF
                                            <locktime>
                                            OP_CHECKLOCKTIMEVERIFY
                                            OP_DROP
                                            <your public key>
                                            OP_CHECKSIG
                                        OP_ELSE
                                            OP_SHA256 
                                            <preimage>
                                            OP_EQUALVERIFY 
                                            <lender's public key>
                                            OP_CHECKSIG
                                        OP_ENDIF
                                        `}</AccordionDetails>
								</Accordion>
							</div>
							<Button
								onClick={fundInitialCollateral}
								variant='contained'>
								Fund {onChangeCollateral().toFixed(8)} BTC
							</Button>
						</div>
					</CardComponent>
					{transactionDetails && <div>{transactionDetails}</div>}
					<Button
						onClick={signToGetBackCollateral}
						variant='outlined'>
						Sign to get back Collateral
					</Button>
					<Button
						onClick={signToGetBackCollateral}
						variant='outlined'>
						Broadcast the transaction to get back Collateral
					</Button>
				</div>
			)}

			{step === 3 && (
				<div className='w-full text-start'>
					<div className='py-4'>Step #3: Withdraw loan</div>
					<CardComponent>
						<div className='w-full text-center flex flex-col gap-4'>
							<h1>$100</h1>
							<Button variant='contained'>Withdraw</Button>
						</div>
					</CardComponent>
				</div>
			)}
		</div>
	);
}

const CardComponent = ({ children }) => {
	return <div className='p-4 shadow'>{children}</div>;
};

export default LoanCreation;
