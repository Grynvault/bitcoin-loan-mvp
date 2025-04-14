/** @format */

'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
//MUI import
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
//Components import
import CardProvider from '@/components/card/CardProvider';
import ButtonProvider from '@/components/button/ButtonProvider';
import PageLoading from '@/components/loading/PageLoading';
import { ChevronDown, CheckIcon, UnlockedIcon } from '@/components/icon/icons';
//Lib
import { useUserLoan, useUserData } from '@/lib/api';
import { shortenAddress, formatUnix, formatUsd, formatBtc, hasTimelockPassed } from '@/lib/util';

const steps = ['Request Loan', 'Deposit BTC Collateral', 'Initiate Loan', 'Loan is Ready'];

export default function ContinueNewLoan({ loanId }) {
	const { data: loan, isPending: loanIsLoading, status: loanStatus, isError: loanIsError } = useUserLoan();
	const { data: userData, isLoading: isUserDataLoading } = useUserData();
	const [loading, setLoading] = useState(false);
	const [loadingTitle, setLoadingTitle] = useState('Loading..');
	//Step 2 (Deposit Collateral) states
	const [loadingStep2, setLoadingStep2] = useState(false);
	const [depositTxid, setDepositTxid] = useState(null);
	const [loadingStep3, setLoadingStep3] = useState(false);
	//Step 3 (Transfer BTC to collateral address)
	const [loadingStep4, setLoadingStep4] = useState(false);
	//Step 3b (Cancel Loan)
	const [unsignedPsbt, setUnsignedPsbt] = useState(null);
	const [loanCancelled, setLoanCancelled] = useState(false);
	const [bitcoinRedeemed, setBitcoinRedeemed] = useState(null);
	const [bitcoinRedeemedTxid, setBitcoinRedeemedTxid] = useState(null);
	//Step 4 (Complete)
	const [startLoanTxid, setStartLoanTxid] = useState(null);

	const queryClient = useQueryClient();

	let router = useRouter();

	const handleNext = () => {
		queryClient.invalidateQueries(['userLoan', loan.borrower_segwit_address]); // 🔁 refetch loan data
	};

	/**
	 *
	 * STEP 2: Deposit Collateral
	 */
	const depositCollateral = async () => {
		let transactionId;

		setLoading(true);
		setLoadingTitle('Waiting for BTC Collateral Deposit...');

		try {
			let txid = await window.unisat.sendBitcoin(loan.init_htlc_address, loan.btc_collateral);
			console.log('transactionId ->', txid);
			transactionId = txid;
		} catch (e) {
			console.log('Error sending Bitcoin:', e);
			setLoading(false);
			return;
		}

		setLoadingTitle('Updating the loan...');
		try {
			const res = await fetch(`/api/update-loan-data/${loan.id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					deposit_txid: transactionId,
				}),
			});

			const data = await res.json();
			setDepositTxid(transactionId);
			console.log(data);
			setLoading(false);
		} catch (e) {
			console.log('Error deposit collateral:', e);
			setLoading(false);
		}
	};

	const continuePostDeposit = async () => {
		setLoading(true);
		setLoadingTitle('Loading...');

		const res = await fetch(`https://mempool.space/testnet/api/tx/${depositTxid || loan.deposit_txid}/hex`);

		if (!res.ok) {
			console.error('HTTP Error:', res.status, await res.text());
			setLoading(false);
			alert('Give it a few seconds for the transaction to kick in and try again!');
			throw new Error('Transaction not found or unreachable');
		}

		const deposit_txhex = await res.text();
		console.log('deposit_txhex ->', deposit_txhex);

		try {
			const res = await fetch(`/api/save-deposit-txhex/${loan.id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					deposit_txhex: deposit_txhex,
				}),
			});

			const data = await res.json();
			console.log(data);
			setLoading(false);
			handleNext();
		} catch (e) {
			console.log('Error deposit collateral:', e);
			setLoading(false);
		}
	};

	const cancelLoan = async () => {
		let signedTransaction;
		let unsigned_Psbt;

		setLoading(true);
		setLoadingTitle('Creating a transaction...');

		try {
			const res = await fetch(`/api/cancel-loan/${loan.id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({}),
			});

			const data = await res.json();
			setUnsignedPsbt(data.psbt);
			unsigned_Psbt = data.psbt;
		} catch (e) {
			console.log('Error deposit collateral:', e);
			setLoading(false);
			return;
		}

		setLoadingTitle('Waiting for your signature...');

		try {
			const res = await window.unisat.signPsbt(unsignedPsbt || unsigned_Psbt, {
				autoFinalized: false,
				toSignInputs: [
					{
						index: 0,
						address: userData.wallet_address,
					},
				],
			});

			console.log('res =', res);
			signedTransaction = res;
		} catch (error) {
			console.log('Error', error);
			setLoading(false);
			return;
		}

		setLoadingTitle('Broadcasting the transaction...');

		try {
			const res = await fetch(`/api/signed-cancel-loan/${loan.id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					signed_psbt: signedTransaction,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || 'Failed to cancel loan');
			}

			console.log('data ->', data);
			setBitcoinRedeemed(data.btc_unlocked);
			setBitcoinRedeemedTxid(data.txid);
			setLoanCancelled(true);
		} catch (e) {
			console.log('Error broadcasting transaction:', e);
			setLoading(false);
			return;
		}

		setLoading(false);
	};

	const startTransferringCollateral = async () => {
		setLoading(true);
		setLoadingTitle('Transferring BTC Collateral...');

		try {
			const res = await fetch(`/api/start-loan/${loan.id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({}),
			});

			const data = await res.json();
			console.log(data);
			setLoading(false);
			setStartLoanTxid(data.txid);
			handleNext();
		} catch (e) {
			console.log('Error deposit collateral:', e);
			setLoading(false);
		}
	};

	const shouldShowLoading = loanIsLoading || loanStatus === 'idle';
	const shouldShowError = loanIsError || (!loan && loanStatus === 'success');

	if (shouldShowLoading) {
		return (
			<div className='w-full h-screen'>
				<PageLoading
					loading={true}
					text='Loading Loan...'
				/>
			</div>
		);
	}

	if (shouldShowError) {
		return <div className='w-full h-screen flex items-center justify-center font-semibold text-xl'>Loan not found</div>;
	}

	return (
		<div className='py-14 px-4 md:p-7 flex flex-col justify-center gap-8 w-full'>
			<PageLoading
				loading={loading}
				text={loadingTitle}
			/>
			<h1 className='text-4xl font-bold'>Borrowing</h1>
			<div className='w-full flex flex-col justify-center items-center gap-10'>
				<Stepper activeStep={loanStatusStep[loan.status]}>
					{steps.map((label, index) => {
						const stepProps = {};
						const labelProps = {};
						return (
							<Step
								key={label}
								{...stepProps}>
								<StepLabel {...labelProps}>{label}</StepLabel>
							</Step>
						);
					})}
				</Stepper>

				{loanCancelled ? (
					<CardProvider className='w-full'>
						<div className='w-full p-4 flex flex-col gap-4'>
							<div className='flex flex-col justify-center items-center gap-1'>
								<div className='text-3xl text-center font-bold py-6'>Loan is cancelled!</div>
								<div className='flex items-center gap-1'>
									<UnlockedIcon />
									<div className='text-2xl'>{(bitcoinRedeemed * 1e-8).toFixed(6)} BTC</div>
								</div>
								has been transferred to your wallet
							</div>
							{bitcoinRedeemedTxid && (
								<div className='text-center text-sm border rounded-lg p-1'>
									Transaction Id:{' '}
									<a
										target='_blank'
										className='font-medium underline text-blue-800'
										href={`https://mempool.space/testnet/tx/${bitcoinRedeemedTxid}`}>
										{shortenAddress(bitcoinRedeemedTxid, 10, 10)}
									</a>
								</div>
							)}

							<ButtonProvider
								onClick={() => {
									handleNext();
									router.push('/');
								}}>
								Complete
							</ButtonProvider>
						</div>
					</CardProvider>
				) : (
					(() => {
						switch (loanStatusStep[loan.status]) {
							case 1:
								return (
									<CardProvider>
										<div className='flex flex-col gap-4 p-4'>
											<h1 className='text-center font-medium'>Deposit Collateral</h1>
											<div className='flex flex-row justify-center items-center gap-2'>
												<div className='text-4xl font-semibold'>{(loan.btc_collateral / 1e8).toFixed(8)} BTC</div>
											</div>
											<div className='text-center text-sm'>
												to{' '}
												<a
													target='_blank'
													className='font-bold underline text-blue-600'
													href={`https://mempool.space/testnet/address/${loan.init_htlc_address}`}>
													{shortenAddress(loan.init_htlc_address)}
												</a>{' '}
												(P2SH)
											</div>
											<Accordion>
												<AccordionSummary
													expandIcon={<ChevronDown />}
													aria-controls='panel1-content'
													id='panel1-header'>
													<div>Scripts for the P2SH Address</div>
												</AccordionSummary>
												<AccordionDetails>
													<ScriptDisplay
														script={`OP_IF
  <timelock>
  OP_CHECKLOCKTIMEVERIFY
  OP_DROP
  <your public key>
  OP_CHECKSIG
OP_ELSE
  OP_SHA256
  <preimage>
  OP_EQUALVERIFY
  <grynvault public key>
  OP_CHECKSIG
OP_ENDIF`}
													/>
												</AccordionDetails>
											</Accordion>
											<div className='border border-gray-300 flex flex-col gap-1 p-3 rounded-md'>
												<div>
													<div className='flex flex-row justify-between items-center'>
														<div>Timelock</div>
														<div>{formatUnix(loan.init_timelock)}</div>
													</div>
													<div className='text-xs'>
														If Grynvault does not deposit the loan within timelock,
														<br /> the collateral can be unlocked by you
													</div>
												</div>
											</div>
											{depositTxid || loan.deposit_txid ? (
												<div className='flex  flex-col gap-0 w-full'>
													<ButtonProvider
														disabled
														loading={loadingStep2}
														onClick={depositCollateral}>
														<CheckIcon /> Deposited!
													</ButtonProvider>

													<div className='text-center mb-4 text-sm'>
														Transaction:{' '}
														<a
															target='_blank'
															className='font-medium underline text-blue-800'
															href={`https://mempool.space/testnet/tx/${depositTxid || loan.deposit_txid}`}>
															{shortenAddress(depositTxid || loan.deposit_txid, 10, 10)}
														</a>
													</div>
													<ButtonProvider
														loading={loadingStep3}
														onClick={continuePostDeposit}>
														Continue
													</ButtonProvider>
												</div>
											) : (
												<ButtonProvider
													loading={loadingStep2}
													onClick={depositCollateral}>
													Deposit Collateral
												</ButtonProvider>
											)}
										</div>
									</CardProvider>
								);
							case 2:
								return (
									<CardProvider>
										<div className='flex flex-col gap-4 p-4'>
											<div className='flex flex-col gap-2'>
												<h1 className='text-center font-semibold text-xl'>Your funds is ready!</h1>
												<div className='text-center text-sm px-2'>
													To initiate the loan and receive funds, click continue to transfer the BTC collateral to the P2SH Collateral address
												</div>
											</div>

											<div className='flex flex-col justify-center items-center w-full'>
												<Image
													src='/images/transferbtc.png'
													alt='Logo'
													width={320}
													height={100}
												/>
												<div className='flex w-full justify-around items-center'>
													<div className='text-xs'>{shortenAddress(loan.init_htlc_address)}</div>
													<div className='text-xs'>Collateral Address</div>
												</div>
											</div>
											<Accordion>
												<AccordionSummary
													expandIcon={<ChevronDown />}
													aria-controls='panel1-content'
													id='panel1-header'>
													<div>Scripts for the Collateral Address</div>
												</AccordionSummary>
												<AccordionDetails>
													<ScriptDisplay
														script={`OP_IF //if loan is not paid by due date (timelock)
  <timelock (due date + 5 days)>
  OP_CHECKLOCKTIMEVERIFY
  OP_DROP
  <grynvault public key>
  OP_CHECKSIG
OP_ELSE //if loan is paid
  OP_SHA256
  <preimage>
  OP_EQUALVERIFY
  <your public key>
  OP_CHECKSIG
OP_ENDIF`}
													/>
												</AccordionDetails>
											</Accordion>
											<ButtonProvider
												loading={loadingStep4}
												onClick={startTransferringCollateral}>
												Continue
											</ButtonProvider>
										</div>
										<div className='p-4 flex flex-col gap-2'>
											<div className='text-xs'>
												If the loan is not funded in time, you may cancel it and reclaim your collateral after the timelock expires. The timelock is enforced by the Bitcoin script
												to guarantee that the lender fulfills their obligation within the allowed window, or the borrower regains control of their funds via the timeout path.
											</div>
											<div className='text-xs text-center'>
												Timelock ends at <b>{formatUnix(loan.init_timelock)} </b>
											</div>
											<ButtonProvider onClick={cancelLoan}>Unlock Collateral</ButtonProvider>

											{/* {hasTimelockPassed(loan.init_timelock) ? (
											<ButtonProvider onClick={cancelLoan}>Unlock Collateral</ButtonProvider>
										) : (
											<ButtonProvider disabled>Unlock Collateral</ButtonProvider>
										)} */}
										</div>
									</CardProvider>
								);
							case 3:
								return (
									<CardProvider>
										<div className='flex flex-col gap-4 p-4'>
											<h1 className='text-center font-medium'>Loan is Ready!</h1>
											<div className='text-5xl text-center font-semibold'>{formatUsd(loan.loan_amount)}</div>
											<div>has been deposited to your account</div>
											<div className='border border-gray-300 flex flex-col gap-1 p-3 rounded-md'>
												<div className='flex flex-row justify-between items-center'>
													<div>Loan-to-value (LTV)</div>
													<div>{loan.loan_to_value}%</div>
												</div>
												<div className='flex flex-row justify-between items-center'>
													<div>BTC Collateral</div>
													<div>{formatBtc(loan.btc_collateral)} BTC</div>
												</div>
												<div className='flex flex-row gap-8 justify-between items-center'>
													<div>P2SH Collateral Address</div>
													<a
														target='_blank'
														className='font-medium underline text-blue-800'
														href={`https://mempool.space/testnet/address/${loan.collateral_htlc_address}`}>
														{shortenAddress(loan.collateral_htlc_address)} BTC
													</a>
												</div>
												<div className='flex flex-row gap-8 justify-between items-center'>
													<div>Loan due date</div>
													<div className='whitespace-nowrap'>{formatUnix(loan.collateral_timelock)}</div>
												</div>
												<div className='flex flex-row justify-between items-center'>
													<div>Fees in BTC</div>
													<div>0 BTC</div>
												</div>
											</div>
											<ButtonProvider onClick={() => router.push('/')}>View Dashboard</ButtonProvider>
										</div>
									</CardProvider>
								);
							default:
								return (
									<CardProvider>
										<div className='flex flex-col gap-4 p-4'>This loan is no longer editable</div>
									</CardProvider>
								);
						}
					})()
				)}
			</div>
		</div>
	);
}

function ScriptDisplay({ script }) {
	return <div className='bg-black text-green-400 font-mono text-sm p-4 rounded-lg overflow-x-auto whitespace-pre'>{script}</div>;
}

const loanStatusStep = {
	collateral_pending: 1,
	collateral_deposited: 1,
	collateral_received: 2,
	active: 3,
};
