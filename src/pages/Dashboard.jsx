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
import { useUserBtcBalance, useBtcPrice, useUserData, useUserLoan } from '@/lib/api';
import { shortenAddress, formatUnix, getTimeLeft, formatUsd } from '@/lib/util';

export default function Dashboard() {
	const { userAddress } = useApp();
	const { data: btcBalance, isLoading: isBtcBalanceLoading } = useUserBtcBalance();
	const { data: btcPrice, isLoading: isBtcPriceLoading } = useBtcPrice();
	const { data: userData, isLoading: isUserDataLoading } = useUserData();
	const { data: userLoan, isLoading: isUserLoanLoading } = useUserLoan();

	return (
		<div className='py-14 px-4 md:p-10 flex flex-col w-full gap-12'>
			<div className='flex flex-row items-center justify-between w-full gap-2'>
				<h1 className='text-4xl font-bold'>Dashboard</h1>
				{userAddress && <div className='text-xs border px-2 py-1 rounded-md border-2 font-semibold w-fit'>{shortenAddress(userAddress)}</div>}
			</div>
			<div className='flex md:flex-row flex-col gap-4 w-full'>
				<LoanCard
					userData={userData}
					userLoan={userLoan}
					btcPrice={btcPrice}
					isUserLoanLoading={isUserLoanLoading}
				/>
				<div className='flex flex-col gap-4 w-full'>
					<FundCard
						userFund={userData?.usd_balance}
						isLoading={isUserDataLoading}
					/>
					<BtcFund
						btcBalance={btcBalance}
						btcPrice={btcPrice}
						isLoading={isBtcBalanceLoading || isBtcPriceLoading}
					/>
				</div>
			</div>
		</div>
	);
}

const LoanCard = ({ userData, userLoan, btcPrice, isUserLoanLoading }) => {
	const { connectWallet, loadingWalet } = useApp();
	let route = useRouter();

	if (isUserLoanLoading)
		return (
			<CardProvider
				maxwidth='100%'
				className='w-full h-full py-6'>
				<div className='flex items-center w-full h-full justify-center'>Loading Loan...</div>
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

	if (!userLoan)
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
	else
		return (
			<CardProvider
				maxwidth='100%'
				className='w-full'>
				<div className='w-full p-4 flex flex-col gap-4'>
					{/* Present day - userLoan.collateral_timelock (convert from UTC to actual time) -> convert in days */}
					<div className='text-sm'>Amount due in {getTimeLeft(userLoan.collateral_timelock)}</div>
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
						<ButtonProvider>Make Payment</ButtonProvider>
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
						</div>
						<div className='flex flex-col gap-1 flex-1'>
							<div className='text-xs flex gap-5 flex-row w-full justify-between'>
								<div>Loan Duration</div>
								<div>7 Days</div>
							</div>
							<div className='text-xs flex gap-5 flex-row w-full justify-between'>
								<div className='whitespace-nowrap'>Due date</div>
								<div className='whitespace-nowrap'>{formatUnix(userLoan.collateral_timelock)}</div>
							</div>
							<div className='text-xs flex gap-5 flex-row w-full justify-between'>
								<div>Fees</div>
								<div>0 BTC</div>
							</div>
						</div>
					</div>
				</div>
			</CardProvider>
		);
};

const FundCard = ({ userFund = 0 }) => {
	return (
		<CardProvider>
			<div className='p-4 flex flex-col gap-2'>
				<div className='font-medium'>Funds Available</div>
				<div className='font-semibold text-3xl'>{formatUsd(userFund)}</div>
				<div className='flex flex-row items-center gap-2'>
					<ButtonProvider>Deposit</ButtonProvider>
					<ButtonProvider>Withdraw</ButtonProvider>
				</div>
			</div>
		</CardProvider>
	);
};

const BtcFund = ({ btcBalance = 0, btcPrice = 0, isLoading = true }) => {
	return (
		<CardProvider className='flex-1 w-full'>
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
