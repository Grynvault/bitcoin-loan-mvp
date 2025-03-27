/** @format */

import React, { useState } from 'react';
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
import { useUserBtcBalance, useBtcPrice } from '@/lib/api';
import { shortenAddress } from '@/lib/util';

export default function Dashboard() {
	const { user } = useApp();
	const { data: btcBalance, isLoading: isBtcBalanceLoading } = useUserBtcBalance();
	const { data: btcPrice, isLoading: isBtcPriceLoading } = useBtcPrice();

	return (
		<div className='py-14 px-4 md:p-10 flex flex-col w-full gap-12'>
			<div className='flex flex-row items-center justify-between w-full gap-2'>
				<h1 className='text-4xl font-bold'>Dashboard</h1>
				{user && <div className='text-xs border px-2 py-1 rounded-md border-2 font-semibold w-fit'>{shortenAddress(user)}</div>}
			</div>
			<div className='flex md:flex-row flex-col gap-4 w-full'>
				<LoanCard user={user} />
				<div className='flex flex-col gap-4 w-full'>
					<FundCard />
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

const LoanCard = ({ user }) => {
	const { setUser } = useApp();
	const [loading, setLoading] = useState(false);

	let route = useRouter();

	const connectWallet = async () => {
		if (!window.unisat) {
			alert('Please install the Unisat Wallet extension.');
			return;
		}

		setLoading(true);

		try {
			let accounts = await window.unisat.requestAccounts();
			console.log(accounts);
			setUser(accounts[0]);
			setLoading(false);
		} catch (e) {
			console.log('Error connecting wallet =>', e);
			setLoading(false);
		}
	};

	const noLoan = true;

	if (!user)
		return (
			<CardProvider
				maxwidth='100%'
				className='w-full py-6'>
				<ConnectWallet
					handleConnectWallet={connectWallet}
					isLoading={loading}
				/>
			</CardProvider>
		);

	if (noLoan)
		return (
			<CardProvider
				maxwidth='100%'
				className='w-full'>
				<div className='w-full py-6 px-4 flex justify-center items-center h-full flex-col gap-4'>
					<div className='font-semibold text-2xl'>You have no loan</div>
					<ButtonProvider onClick={() => route.push('/borrow')}>Initiate Loan</ButtonProvider>
				</div>
			</CardProvider>
		);
	else
		return (
			<CardProvider
				maxwidth='100%'
				className='w-full'>
				<div className='w-full p-4 flex flex-col gap-4'>
					<div className='text-sm'>Amount due in 7 days</div>
					<div className='flex flex-row flex-wrap w-full justify-between items-center gap-4'>
						<div className='flex flex-col gap-1'>
							<div className='text-4xl font-bold'>$1,000.00</div>
							<div className='flex items-center justify-start gap-2'>
								<div className='flex items-center gap-\ text-sm'>
									<LockedIcon />
									0.04 BTC
								</div>
								<div className='text-sm'>($2,500)</div>
							</div>
						</div>
						<ButtonProvider>Make Payment</ButtonProvider>
					</div>
					<div className='border-gray-400 border rounded-lg p-3 flex flex-col justify-between gap-1'>
						<div className='flex flex-col gap-1 flex-1'>
							<div className='text-xs flex gap-5 flex-row w-full justify-between'>
								<div>LTV</div>
								<div>70%</div>
							</div>
							<div className='text-xs flex gap-5 flex-row w-full justify-between'>
								<div>BTC Collateral</div>
								<div>0.02 BTC</div>
							</div>
							<div className='text-xs flex gap-5 flex-row w-full justify-between'>
								<div className='whitespace-nowrap'>P2SH Collateral</div>
								<a
									className='font-bold underline'
									href='http://mempool.space/testnet/address/2MvXdRfpecoFp3yjZHYbtaDhuTk5mDLHkZA'
									target='_blank'
									rel='noreferrer'>
									{shortenAddress('2MvXdRfpecoFp3yjZHYbtaDhuTk5mDLHkZA', 5, 5)}
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
								<div className='whitespace-nowrap'>Mar 28, 2025 10:00PM</div>
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
				<div className='font-semibold text-3xl'>{userFund.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
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
