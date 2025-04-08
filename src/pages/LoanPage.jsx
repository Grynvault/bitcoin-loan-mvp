/** @format */
'use client';
import React, { useState } from 'react';

import { useRouter } from 'next/navigation';
//MUI Import
import CircularProgress from '@mui/material/CircularProgress';
//Context import
import { useApp } from '@/context/AppContext';
//Components import
import ButtonProvider from '@/components/button/ButtonProvider';
import CardProvider from '@/components/card/CardProvider';
import ModalProvider from '@/components/modal/ModalProvider';
import { LockedIcon, UnlockedIcon, LockedIconXL } from '@/components/icon/icons';
import ConnectWallet from '@/components/template/ConnectWallet';
//Lib
import { useBtcPrice, useUserData, useUserLoan } from '@/lib/api';
import { shortenAddress, formatUnix, getTimeLeft, formatUsd } from '@/lib/util';

function LoanPage() {
	const { connectWallet, loadingWalet } = useApp();
	const { data: btcPrice, isLoading: isBtcPriceLoading } = useBtcPrice();
	const { data: userData, isLoading: isUserDataLoading } = useUserData();
	const { data: loan, isLoading: loanIsLoading, isError: loanError } = useUserLoan();

	const [openPayModal, setOpenPayModal] = useState(false);

	const [loading1, setLoading1] = useState(false);
	const [loading2, setLoading2] = useState(false);
	const [unsignedPsbt, setUnsignedPsbt] = useState(null);
	const [unlockTxid, setUnlockTxid] = useState(null);

	const handleNext = () => {
		window.location.reload(); //Reload to update the status to move to the next page
	};

	const payLoan = async () => {
		setLoading1(true);

		try {
			const res = await fetch(`/api/pay-loan/${loan.id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({}),
			});

			const data = await res.json();
			console.log(data);
			setUnsignedPsbt(data.loan.unsigned_psbt_hex);
			setLoading1(false);
			handleNext();
		} catch (e) {
			console.log('Error pay loan:', e);
			setLoading1(false);
		}
	};

	const signToGetBackCollateral = async () => {
		let signedTransaction;
		setLoading2(true);

		try {
			let res = await window.unisat.signPsbt(unsignedPsbt || loan.unsigned_psbt_hex, {
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
			setLoading2(false);
		} catch (error) {
			console.log('Error', error);
			setLoading2(false);
		}

		try {
			const res = await fetch(`api/unlock-collateral/${loan.id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					signed_psbt: signedTransaction,
				}),
			});

			const data = await res.json();
			console.log(data);
			setUnlockTxid(data.txid);
			setLoading2(false);
			handleNext();
		} catch (e) {
			console.log('Error unlock collateral:', e);
			setLoading2(false);
		}
	};

	if (loanIsLoading) return <div>Loading loan data...</div>;
	if (loanError || !loan) return <div>Failed to load loan.</div>;

	return (
		<div className='py-14 px-4 md:p-10 flex flex-col w-full gap-12'>
			<div className='flex flex-row items-center justify-between w-full gap-2'>
				<h1 className='text-4xl font-bold'>Loan</h1>
			</div>
			<div className='flex flex-row justify-center items-center'>
				{!userData ? (
					<CardProvider className='w-full p-8'>
						<ConnectWallet
							handleConnectWallet={connectWallet}
							isLoading={loadingWalet}
						/>
					</CardProvider>
				) : (
					(() => {
						switch (loan.status) {
							case 'active':
								return (
									<>
										<CardProvider className='w-full'>
											<div className='w-full p-4 flex flex-col gap-4'>
												<div className='text-sm text-center'>Amount due</div>

												<div className='flex flex-col justify-center items-center gap-1'>
													<div className='text-4xl text-center font-bold'>{formatUsd(loan.loan_amount)}</div>
													<div className='flex items-center justify-center justify-start gap-2'>
														<div className='flex items-center gap-1 text-sm'>
															<LockedIcon />
															{(loan.btc_collateral * 1e-8).toFixed(6)} BTC
														</div>
														<div className='text-sm'>{(loan.btc_collateral * btcPrice * 1e-8).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
													</div>
												</div>
												<div className='border-gray-400 border rounded-lg p-3 flex flex-col justify-between gap-1'>
													<div className='flex flex-col gap-1 flex-1'>
														<div className='text-xs flex gap-5 flex-row w-full justify-between'>
															<div>LTV</div>
															<div>{loan.loan_to_value}%</div>
														</div>
														<div className='text-xs flex gap-5 flex-row w-full justify-between'>
															<div>BTC Collateral</div>
															<div>{(loan.btc_collateral * 1e-8).toFixed(6)} BTC</div>
														</div>
														<div className='text-xs flex gap-5 flex-row w-full justify-between'>
															<div className='whitespace-nowrap'>P2SH Collateral</div>
															<a
																className='font-bold underline'
																href={`http://mempool.space/testnet/address/${loan.collateral_htlc_address}`}
																target='_blank'
																rel='noreferrer'>
																{shortenAddress(loan.collateral_htlc_address, 5, 5)}
															</a>
														</div>
													</div>
													<div className='flex flex-col gap-1 flex-1'>
														<div className='text-xs flex gap-5 flex-row w-full justify-between'>
															<div>Loan Duration</div>
															<div>7 Days</div>
														</div>
														<div className='text-xs flex gap-5 flex-row w-full justify-between'>
															<div className='whitespace-nowrap'>Due date</div>
															<div className='whitespace-nowrap'>{formatUnix(loan.collateral_timelock)}</div>
														</div>
														<div className='text-xs flex gap-5 flex-row w-full justify-between'>
															<div>Fees</div>
															<div>0 BTC</div>
														</div>
													</div>
												</div>
												<ButtonProvider
													// onClick={payLoan}
													onClick={() => setOpenPayModal(true)}>
													Make Payment
												</ButtonProvider>
											</div>
										</CardProvider>
										<ModalProvider
											open={openPayModal}
											handleOpen={() => setOpenPayModal(true)}
											handleClose={() => setOpenPayModal(false)}>
											<div className='bg-white p-4 flex flex-col gap-3 items-center justify-center'>
												<div className='text-4xl text-center font-bold'>{formatUsd(loan.loan_amount)}</div>
												<ButtonProvider
													onClick={payLoan}
													loading={loading1}>
													Simulate Payment
												</ButtonProvider>
											</div>
										</ModalProvider>
									</>
								);
							case 'repaid':
								return (
									<CardProvider className='w-full'>
										<div className='w-full p-4 flex flex-col gap-4'>
											<div className='flex flex-col justify-center items-center gap-1'>
												<div className='py-4'>
													<div className='text-2xl text-center font-bold pb-1'>Loan is paid!</div>
													<div className='text-lg font-light text-center line-through'>{loan.loan_amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
												</div>
												<div className='flex items-center gap-1'>
													<LockedIconXL />
													<div className='text-4xl'>{(loan.btc_collateral * 1e-8).toFixed(6)} BTC</div>
												</div>
											</div>
											<div className='border-gray-400 border rounded-lg p-3 flex flex-col justify-between gap-1'>
												<div className='flex flex-col gap-1 flex-1'>
													<div className='text-xs flex gap-5 flex-row w-full justify-between'>
														<div>LTV</div>
														<div>{loan.loan_to_value}%</div>
													</div>
													<div className='text-xs flex gap-5 flex-row w-full justify-between'>
														<div>BTC Collateral</div>
														<div>{(loan.btc_collateral * 1e-8).toFixed(6)} BTC</div>
													</div>
													<div className='text-xs flex gap-5 flex-row w-full justify-between'>
														<div className='whitespace-nowrap'>P2SH Collateral</div>
														<a
															className='font-bold underline'
															href={`http://mempool.space/testnet/address/${loan.collateral_htlc_address}`}
															target='_blank'
															rel='noreferrer'>
															{shortenAddress(loan.collateral_htlc_address, 5, 5)}
														</a>
													</div>
												</div>
												<div className='flex flex-col gap-1 flex-1'>
													<div className='text-xs flex gap-5 flex-row w-full justify-between'>
														<div>Loan Duration</div>
														<div>7 Days</div>
													</div>
													<div className='text-xs flex gap-5 flex-row w-full justify-between'>
														<div className='whitespace-nowrap'>Due date</div>
														<div className='whitespace-nowrap'>{formatUnix(loan.collateral_timelock)}</div>
													</div>
													<div className='text-xs flex gap-5 flex-row w-full justify-between'>
														<div>Fees</div>
														<div>0 BTC</div>
													</div>
												</div>
											</div>
											<ButtonProvider
												onClick={signToGetBackCollateral}
												loading={loading2}>
												Unlock Collateral
											</ButtonProvider>
											{unlockTxid && (
												<a
													href={`https://mempool.space/testnet/tx/${unlockTxid}`}
													target='_blank'
													rel='noreferrer'>
													{unlockTxid}
												</a>
											)}
										</div>
									</CardProvider>
								);
							case 'closed':
								return (
									<CardProvider className='w-full'>
										<div className='w-full p-4 flex flex-col gap-4'>
											<div className='flex flex-col justify-center items-center gap-1'>
												<div className='text-3xl text-center font-bold py-6'>Loan is paid!</div>
												<div className='flex items-center gap-1'>
													<UnlockedIcon />
													<div className='text-2xl'>0.04 BTC</div>
												</div>
												has been transferred to your wallet
											</div>
											<div className='text-center text-sm border rounded-lg p-1'>
												Transaction Id: <a>{shortenAddress(loan.unlock_collateral_txid, 10, 10)}</a>
											</div>
											<ButtonProvider>Complete</ButtonProvider>
										</div>
									</CardProvider>
								);
						}
					})()
				)}
			</div>
		</div>
	);
}

export default LoanPage;
