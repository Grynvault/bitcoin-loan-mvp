/** @format */

import React from 'react';
import { useRouter } from 'next/navigation';
//Context import
import { useApp } from '@/context/AppContext';
//Components import
import ConnectWallet from '@/components/template/ConnectWallet';
import ButtonProvider from '@/components/button/ButtonProvider';
import CardProvider from '@/components/card/CardProvider';
import { LockedIcon } from '@/components/icon/icons';
//Lib
import { useUserBtcBalance } from '@/lib/api';
import { shortenAddress } from '@/lib/util';

export default function Dashboard() {
	const router = useRouter();
	const { user } = useApp();
	const { data: btcBalance, isLoading, isError } = useUserBtcBalance();

	return (
		<div className='w-full h-screen flex justify-center items-center'>
			<ConnectWallet />
		</div>
	);

	// return (
	// 	<div className='py-14 px-4 md:p-10 flex flex-col w-full gap-12'>
	// 		<div className='flex flex-row items-center justify-between w-full gap-2'>
	// 			<h1 className='text-4xl font-bold'>Dashboard</h1>
	// 			<div className='text-xs border px-2 py-1 rounded-md border-2 font-semibold w-fit'>{shortenAddress(user)}</div>
	// 		</div>
	// 		<div className='flex md:flex-row flex-col gap-4 w-full'>
	// 			<LoanCard />
	// 			<div className='flex flex-col gap-4 w-full'>
	// 				<FundCard />
	// 				<BtcFund />
	// 			</div>
	// 			{/* <CardProvider>
	// 				<div className='flex flex-col gap-2 p-4'>
	// 					<div>USD Balance:</div>
	// 					<h2 className='font-bold text-xl'>$ 0.00</h2>
	// 				</div>
	// 			</CardProvider>
	// 			<CardProvider>
	// 				<div className='flex flex-col gap-2 p-4'>
	// 					<div>BTC Balance:</div>
	// 					<h2 className='font-bold text-xl'>{isLoading ? 'Loading...' : (btcBalance / 1e8).toFixed(6)} BTC</h2>
	// 				</div>
	// 			</CardProvider> */}
	// 		</div>
	// 	</div>
	// );
}

const LoanCard = ({ loanDetails }) => {
	const noLoan = true;

	if (noLoan)
		return (
			<CardProvider
				maxWidth='100%'
				className='w-full'>
				<div className='w-full p-4 flex justify-center items-center h-full flex-col gap-4'>
					<div className='font-semibold text-2xl'>You have no loan</div>
					<ButtonProvider>Initiate Loan</ButtonProvider>
				</div>
			</CardProvider>
		);
	else
		return (
			<CardProvider
				maxWidth='100%'
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

const FundCard = ({ userWallets }) => {
	return (
		<CardProvider>
			<div className='p-4 flex flex-col gap-2'>
				<div className='font-medium'>Funds Available</div>
				<div className='font-semibold text-3xl'>$100.00</div>
				<div className='flex flex-row items-center gap-2'>
					<ButtonProvider>Deposit</ButtonProvider>
					<ButtonProvider>Withdraw</ButtonProvider>
				</div>
			</div>
		</CardProvider>
	);
};

const BtcFund = ({ userBtc }) => {
	return (
		<CardProvider className='flex-1 w-full'>
			<div className='p-4 h-full flex flex-col gap-2'>
				<div className='font-medium'>Your wallet</div>
				<div className='flex flex-1 items-center flex-wrap gap-3'>
					<div className='font-semibold text-3xl'>0.04 BTC</div>
					<div className='text-xl font-light'>$2,500</div>
				</div>
			</div>
		</CardProvider>
	);
};
