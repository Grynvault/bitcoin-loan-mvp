/** @format */
'use client';
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
//Context import
import { useApp } from '@/context/AppContext';
//Components import
import ButtonProvider from '@/components/button/ButtonProvider';
import CardProvider from '@/components/card/CardProvider';
import ModalProvider from '@/components/modal/ModalProvider';
import { LockedIcon, UnlockedIcon, LockedIconXL } from '@/components/icon/icons';
import ConnectWallet from '@/components/template/ConnectWallet';
import PageLoading from '@/components/loading/PageLoading';
//Lib
import { useBtcPrice, useUserData, useUserLoan } from '@/lib/api';
import { shortenAddress, formatUnix, getTimeLeft, formatUsd } from '@/lib/util';

function LoanPage() {
	const { connectWallet, loadingWalet } = useApp();
	const { data: btcPrice, isLoading: isBtcPriceLoading } = useBtcPrice();
	const { data: userData, isLoading: isUserDataLoading } = useUserData();
	const { data: loan, isLoading: loanIsLoading, isError: loanError } = useUserLoan();

	const [openPayModal, setOpenPayModal] = useState(false);

	const [loading, setLoading] = useState(false);
	const [loading1, setLoading1] = useState(false);
	const [loading2, setLoading2] = useState(false);
	const [unsignedPsbt, setUnsignedPsbt] = useState(null);
	const [unlockTxid, setUnlockTxid] = useState(null);

	const [loanPaid, setLoanPaid] = useState(false);
	const [unlockCollateralTxid, setUnlockCollateralTxid] = useState(null);

	const queryClient = useQueryClient();

	let router = useRouter();

	const handleNext = () => {
		queryClient.invalidateQueries(['loan', loan.borrower_segwit_address]); // 🔁 refetch loan data
	};

	const payLoan = async () => {
		setLoading1(true);
		setLoading(true);

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
			setLoading(false);
			handleNext();
		} catch (e) {
			console.log('Error pay loan:', e);
			setLoading1(false);
			setLoading(false);
		}
	};

	const signToGetBackCollateral = async () => {
		let signedTransaction;
		setLoading(true);

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
		} catch (error) {
			console.log('Error', error);
			setLoading(false);
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
			setUnlockTxid(data.loan.unlock_collateral_txid);
			setUnlockCollateralTxid(data.loan.unlock_collateral_txid);
			setLoanPaid(true);
			setLoading(false);
		} catch (e) {
			console.log('Error unlock collateral:', e);
			setLoading(false);
		}
	};

	if (loanIsLoading)
		return (
			<PageLoading
				loading={true}
				text='Loading Loan data..'
			/>
		);
	if (loanError || !loan)
		return (
			<div className='py-14 px-4 md:p-10 flex flex-col w-full gap-12'>
				<div className='flex flex-row items-center justify-between w-full gap-2'>
					<h1 className='text-4xl font-bold'>Loan</h1>
				</div>
				<div className='flex flex-row justify-center items-center'>
					<CardProvider className='w-full p-8'>
						<div className='h-full flex flex-col p-3'>
							<div className='w-full py-6 px-4 flex justify-center items-center h-full flex-col gap-4'>
								<div className='font-semibold text-2xl'>You have no loan</div>
								<ButtonProvider onClick={() => router.push('/create-loan/new')}>Initiate Loan</ButtonProvider>
							</div>
						</div>
					</CardProvider>
				</div>
			</div>
		);

	return (
		<div className='py-14 px-4 md:p-10 flex flex-col w-full gap-12'>
			<PageLoading loading={loading} />
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
				) : loanPaid ? (
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
							{unlockCollateralTxid && (
								<div className='text-center text-sm border rounded-lg p-1'>
									Transaction Id:{' '}
									<a
										target='_blank'
										className='font-medium underline text-blue-800'
										href={`https://mempool.space/testnet/tx/${unlockCollateralTxid}`}>
										{shortenAddress(unlockCollateralTxid, 10, 10)}
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
							default:
								return (
									<CardProvider
										maxwidth='100%'
										className='w-full'>
										<div className='w-full py-6 px-4 flex justify-center items-center h-full flex-col gap-4'>
											<div className='font-semibold text-2xl'>You have no loan</div>
											<ButtonProvider onClick={() => route.push('/create-loan/new')}>Initiate Loan</ButtonProvider>
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
