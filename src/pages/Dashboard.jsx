/** @format */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
//MUI Import
import CircularProgress from '@mui/material/CircularProgress';
//Context import
import { useApp } from '@/context/AppContext';
//Components import
import ConnectWallet from '@/components/template/ConnectWallet';
import ButtonProvider from '@/components/button/ButtonProvider';
import CardProvider from '@/components/card/CardProvider';
import { LockedIcon } from '@/components/icon/icons';
//Lib
import { useUserBtcBalance, useBtcPrice, useUserData, useUserLoan, useUserLoanList, useUserTransactions } from '@/lib/api';
import { shortenAddress, formatUnix, getTimeLeft, formatUsd, formatBtc, formatUnixDateWithOrdinal } from '@/lib/util';

export default function Dashboard() {
	const { userAddress } = useApp();
	const { data: btcBalance, isLoading: isBtcBalanceLoading } = useUserBtcBalance();
	const { data: btcPrice, isLoading: isBtcPriceLoading } = useBtcPrice();
	const { data: userData, isLoading: isUserDataLoading } = useUserData();
	const { data: userLoan, isLoading: isUserLoanLoading } = useUserLoan();
	const { data: userLoanList, isLoading: isUserLoanListLoading } = useUserLoanList();
	const { data: userTransactions, isLoading: isUserTransactionLoading } = useUserTransactions();

	return (
		<div className='py-20 px-4 md:p-10 flex flex-col w-full gap-12'>
			<div className='flex flex-col gap-6'>
				<div className='flex flex-row items-center justify-between w-full gap-2'>
					<h1 className='text-4xl font-bold'>Dashboard</h1>
					{userAddress && <div className='text-xs border px-2 py-1 rounded-md border-2 font-semibold w-fit'>{shortenAddress(userAddress)}</div>}
				</div>
				<div className='flex md:flex-row flex-col gap-8 w-full'>
					<LoanCard
						userData={userData}
						userLoan={userLoan}
						btcPrice={btcPrice}
						isUserLoanLoading={isUserLoanLoading || isUserLoanListLoading}
						userLoanList={userLoanList}
					/>
					<div className='flex flex-col gap-8 w-full'>
						<FundCard
							userFund={userData?.usd_balance}
							isLoading={isUserDataLoading || isUserDataLoading}
						/>
						<BtcFund
							btcBalance={btcBalance}
							btcPrice={btcPrice}
							isLoading={isBtcBalanceLoading || isBtcPriceLoading}
						/>
					</div>
				</div>
			</div>
			<div className='flex flex-col gap-6'>
				<h1 className='text-4xl pt-4 font-bold'>Transaction</h1>
				<TransactionTable transactions={userTransactions} />
			</div>
		</div>
	);
}

const LoanCard = ({ userData, userLoan, btcPrice, userLoanList, isUserLoanLoading }) => {
	const { connectWallet, loadingWalet } = useApp();
	let router = useRouter();

	if (isUserLoanLoading)
		return (
			<CardProvider
				maxwidth='100%'
				className='w-full h-[290px] py-6'>
				<div className='flex items-center flex-col w-full gap-2 h-full justify-center'>
					<CircularProgress
						size={30}
						sx={{ color: 'black' }}
					/>
					Loading your loan
				</div>
			</CardProvider>
		);

	if (!userData)
		return (
			<CardProvider
				maxwidth='100%'
				className='w-full py-6'>
				<ConnectWallet
					handleConnectWallet={connectWallet}
					isLoading={loadingWalet}
				/>
			</CardProvider>
		);

	if (userLoan)
		return (
			<CardProvider
				maxwidth='100%'
				className='w-full'>
				<div className='w-full p-4 flex flex-col gap-4'>
					{userLoan.status === 'active' ? (
						<div className='flex items-center justify-between'>
							<div className='text-sm'>
								Amount due in <b>{getTimeLeft(userLoan.collateral_timelock)}</b>
							</div>
							<div className='flex'>
								<div className={`${statusStyles[userLoan.status].color} py-1 px-4 font-semibold rounded-full`}>{statusStyles[userLoan.status].label}</div>
							</div>
						</div>
					) : (
						<div className='flex'>
							<div className={`${statusStyles[userLoan.status].color} py-1 px-4 font-semibold rounded-full`}>{statusStyles[userLoan.status].label}</div>
						</div>
					)}
					<div className='flex flex-row flex-wrap w-full justify-between items-center gap-4'>
						<div className='flex flex-col gap-1'>
							<div className='text-4xl font-bold'>{formatUsd(userLoan.loan_amount)}</div>
							<div className='flex items-center justify-start gap-2'>
								<div className='flex items-center gap-\ text-sm'>
									<LockedIcon />
									{(userLoan.btc_collateral * 1e-8).toFixed(6)} BTC
								</div>
								<div className='text-sm'>{formatUsd(userLoan.btc_collateral * btcPrice * 1e-6)}</div>
							</div>
						</div>
						{userLoan.status === 'active' ? (
							<ButtonProvider onClick={() => router.push('/loan')}>Make Payment</ButtonProvider>
						) : userLoan.status === 'repaid' ? (
							<ButtonProvider onClick={() => router.push('/loan')}>Unlock Collateral</ButtonProvider>
						) : (
							<ButtonProvider onClick={() => router.push(`/create-loan/${userLoan.id}`)}>{statusStyles[userLoan.status].actionLabel}</ButtonProvider>
						)}
					</div>
					<div className='border-gray-400 border rounded-lg p-3 flex flex-col justify-between gap-1'>
						<div className='flex flex-col gap-1 flex-1'>
							<div className='text-xs flex gap-5 flex-row w-full justify-between'>
								<div>LTV</div>
								<div>{userLoan.loan_to_value}%</div>
							</div>
							<div className='text-xs flex gap-5 flex-row w-full justify-between'>
								<div>BTC Collateral</div>
								<div>{(userLoan.btc_collateral * 1e-8).toFixed(6)} BTC</div>
							</div>
							{userLoan.collateral_htlc_address && (
								<div className='text-xs flex gap-5 flex-row w-full justify-between'>
									<div className='whitespace-nowrap'>P2SH Collateral</div>
									<a
										className='font-bold underline'
										href={`http://mempool.space/testnet/address/${userLoan.collateral_htlc_address}`}
										target='_blank'
										rel='noreferrer'>
										{shortenAddress(userLoan.collateral_htlc_address, 5, 5)}
									</a>
								</div>
							)}
						</div>
						<div className='flex flex-col gap-1 flex-1'>
							<div className='text-xs flex gap-5 flex-row w-full justify-between'>
								<div>Loan Duration</div>
								<div>{userLoan.loan_duration} hours</div>
							</div>
							{userLoan.collateral_timelock && (
								<div className='text-xs flex gap-5 flex-row w-full justify-between'>
									<div className='whitespace-nowrap'>Due date</div>
									<div className='whitespace-nowrap'>{formatUnix(userLoan.collateral_timelock)}</div>
								</div>
							)}

							<div className='text-xs flex gap-5 flex-row w-full justify-between'>
								<div>Fees</div>
								<div>0 BTC</div>
							</div>
						</div>
					</div>
				</div>
			</CardProvider>
		);
	else
		return (
			<CardProvider
				maxwidth='100%'
				className='w-full'>
				<div className='h-full flex flex-col p-3'>
					<div className='w-full py-6 px-4 flex justify-center items-center h-full flex-col gap-4'>
						<div className='font-semibold text-2xl'>You have no loan</div>
						<ButtonProvider onClick={() => router.push('/create-loan/new')}>Initiate Loan</ButtonProvider>
					</div>
					{userLoanList && userLoanList.length > 0 && (
						<div className='p-2 '>
							<div className='flex items-center justify-between pb-1'>
								<h3 className='font-medium'>Previous Loans</h3>
								<div
									className='text-sm cursor-pointer underline'
									onClick={() => router.push('/loan')}>
									View All
								</div>
							</div>
							<div className='border rounded-lg p-1 px-2 text-xs'>
								<div className='grid grid-cols-4 pb-1'>
									<div>Loan</div>
									<div>BTC Collateral</div>
									<div>Duration</div>
									<div className='text-end'>End at</div>
								</div>
								{userLoanList?.slice(0, 3).map((loan) => (
									<div
										key={loan.id}
										className='grid grid-cols-4'>
										<div>{formatUsd(loan.loan_amount)}</div>
										<div>{(loan.btc_collateral * 1e-8).toFixed(6)} BTC</div>
										<div>{loan.loan_duration} hrs</div>
										<div className='text-end'>{formatUnixDateWithOrdinal(loan.paid_at_timestamp)}</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</CardProvider>
		);
};

const FundCard = ({ userFund = 0 }) => {
	return (
		<CardProvider maxwidth='100%'>
			<div className='p-4 flex flex-col gap-2'>
				<div className='font-medium'>Funds Available</div>
				<div className='font-semibold py-4 text-3xl'>{formatUsd(userFund)}</div>
				{/* <div className='flex flex-row items-center gap-2'>
					<ButtonProvider>Deposit</ButtonProvider>
					<ButtonProvider>Withdraw</ButtonProvider>
				</div> */}
			</div>
		</CardProvider>
	);
};

const BtcFund = ({ btcBalance = 0, btcPrice = 0, isLoading = true }) => {
	return (
		<CardProvider
			className='flex-1 w-full'
			maxwidth='100%'>
			<div className='p-4 h-full flex flex-col gap-2'>
				<div className='font-medium'>Your wallet</div>
				{isLoading ? (
					<div className='flex items-center justify-center bg-white/60 py-4'>
						<CircularProgress
							size={30}
							sx={{ color: 'black' }}
						/>
					</div>
				) : (
					<div className='flex flex-1 items-center flex-wrap gap-3 py-3'>
						<div className='font-semibold text-3xl'>{(btcBalance / 1e8).toFixed(4)} BTC</div>
						<div className='text-xl font-light'>{((btcBalance * btcPrice) / 1e8).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
					</div>
				)}
			</div>
		</CardProvider>
	);
};

const TransactionTable = ({ transactions }) => {
	return (
		<div className='w-full'>
			<div className='overflow-x-auto rounded-lg border border-gray-400 shadow-sm bg-white'>
				<table className='min-w-full divide-y divide-gray-200 text-sm'>
					<thead className='bg-gray-50'>
						<tr>
							<th className='px-6 py-3 text-left font-medium text-gray-600'>Date</th>
							<th className='px-6 py-3 text-left font-medium text-gray-600'>Type</th>
							<th className='px-6 py-3 text-left font-medium text-gray-600'>Status</th>
							<th className='px-6 py-3 text-left font-medium text-gray-600'>Amount</th>
							<th className='px-6 py-3 text-left font-medium text-gray-600'>Transaction</th>
							<th className='px-6 py-3 text-left font-medium text-gray-600'>TXID</th>
						</tr>
					</thead>
					<tbody className='divide-y divide-gray-100'>
						{transactions?.length > 0 ? (
							transactions.map((tx) => (
								<tr
									key={tx.id}
									className='hover:bg-gray-50 transition'>
									<td className='px-6 py-4 text-gray-800 text-xs'>{new Date(tx.created_at).toLocaleString()}</td>
									<td className='px-6 py-4 font-medium text-gray-900 capitalize'>{tx.type.replace('_', ' ')}</td>
									<td className='px-6 py-4'>
										<span
											className={`inline-flex capitalize px-2 py-1 text-xs font-medium rounded-full
					  ${tx.status === 'confirmed' ? 'bg-green-100 text-green-800' : tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
											{tx.status}
										</span>
									</td>
									<td className={displayAmount(tx.amount, tx.currency, tx.type).className}>{displayAmount(tx.amount, tx.currency, tx.type).formatted}</td>
									<td className='px-6 py-4 text-gray-700'>
										{tx.details?.txid ? (
											<div className='flex items-center gap-1'>
												<a
													href={`https://mempool.space/testnet/address/${tx.details?.from_address}`}
													className='text-blue-600 hover:underline'
													target='_blank'
													rel='noopener noreferrer'>
													{shortenAddress(tx.details?.from_address, 4, 4)}
												</a>
												<svg
													xmlns='http://www.w3.org/2000/svg'
													fill='none'
													viewBox='0 0 24 24'
													strokeWidth={1.5}
													stroke='currentColor'
													className='size-6'>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														d='M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3'
													/>
												</svg>
												<a
													href={`https://mempool.space/testnet/address/${tx.details?.to_address}`}
													className='text-blue-600 hover:underline'
													target='_blank'
													rel='noopener noreferrer'>
													{shortenAddress(tx.details?.to_address, 3, 3)}
												</a>
											</div>
										) : null}
									</td>
									<td className='px-6 py-4'>
										{tx.details?.txid ? (
											<a
												href={`https://mempool.space/testnet/tx/${tx.details?.txid}`}
												className='text-blue-600 hover:underline'
												target='_blank'
												rel='noopener noreferrer'>
												{tx.details?.txid.slice(0, 8)}...{tx.details?.txid.slice(-6)}
											</a>
										) : (
											<span className='text-gray-400 italic'>N/A</span>
										)}
									</td>
								</tr>
							))
						) : (
							<tr>
								<td
									colSpan='6'
									className='px-6 py-8 text-center text-gray-500'>
									No transactions yet.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export function displayAmount(amount, currency, type) {
	if (amount == null || !currency) return { formatted: '-', className: '' };

	const upperCurrency = currency.toUpperCase();
	const upperType = (type || '').toLowerCase();

	let sign = '';
	let className = 'text-center';

	// Apply type-based rules
	if (['loan_funded', 'collateral_redeemed'].includes(upperType)) {
		sign = '+';
		className = 'text-green-600 font-semibold text-center';
	} else if (['loan_repaid', 'collateral_deposited'].includes(upperType)) {
		sign = '-';
		className = 'text-red-600 font-semibold text-center';
	}

	// Format the amount
	let formatted = '';
	switch (upperCurrency) {
		case 'USD':
			formatted = `${sign}${formatUsd(amount)}`;
			break;
		case 'BTC':
			formatted = `${sign}${formatBtc(amount)}`;
			break;
		default:
			formatted = `${sign}${Math.abs(amount)} ${upperCurrency}`;
	}

	return { formatted, className };
}

const statusStyles = {
	requested: {
		label: 'Waiting Approval',
		color: 'bg-yellow-100 text-yellow-800',
		actionLabel: 'Continue',
	},
	accepted: {
		label: 'Accepted',
		color: 'bg-blue-100 text-blue-800',
		actionLabel: 'Deposit Collateral',
	},
	collateral_pending: {
		label: 'Awaiting Deposit',
		color: 'bg-orange-100 text-orange-800',
		actionLabel: 'Deposit Collateral',
	},
	collateral_deposited: {
		label: 'Collateral Deposited',
		color: 'bg-orange-100 text-orange-800',
		actionLabel: 'Continue',
	},
	collateral_received: {
		label: 'Loan is Ready',
		color: 'bg-orange-100 text-orange-800',
		actionLabel: 'Start Loan',
	},
	active: {
		label: 'Active',
		color: 'bg-green-100 text-green-800',
		actionLabel: 'Make Payment',
	},
	repaid: {
		label: 'Repaid',
		color: 'bg-indigo-100 text-indigo-800',
		actionLabel: 'Unlock Collateral',
	},
	defaulted: {
		label: 'Defaulted',
		color: 'bg-red-100 text-red-800',
		actionLabel: '',
	},
	closed: {
		label: 'Closed',
		color: 'bg-gray-100 text-gray-800',
		actionLabel: '',
	},
};
