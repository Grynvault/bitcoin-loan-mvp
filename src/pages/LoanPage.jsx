/** @format */
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
//Context import
import { useApp } from '@/context/AppContext';
//Components import
import ButtonProvider from '@/components/button/ButtonProvider';
import CardProvider from '@/components/card/CardProvider';
import { LockedIcon, UnlockedIcon } from '@/components/icon/icons';
import ConnectWallet from '@/components/template/ConnectWallet';
//Lib
import { useUserBtcBalance } from '@/lib/api';
import { shortenAddress } from '@/lib/util';

function LoanPage() {
	const loanPaid = true;
	const { user, setUser } = useApp();

	const [loading, setLoading] = useState(false);

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

	return (
		<div className='py-14 px-4 md:p-10 flex flex-col w-full gap-12'>
			<div className='flex flex-row items-center justify-between w-full gap-2'>
				<h1 className='text-4xl font-bold'>Loan</h1>
			</div>
			<div className='flex flex-row justify-center items-center'>
				{!user ? (
					<CardProvider className='w-full p-8'>
						<ConnectWallet
							handleConnectWallet={connectWallet}
							isLoading={loading}
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
							<div className='text-center text-sm border rounded-lg p-1'>
								Transaction Id: <a>{shortenAddress('740d0f6881f41a2f1f68196cd1b95c2c63c819953ee59ed1aba64c5695c9080b', 10, 10)}</a>
							</div>
							<ButtonProvider>Complete</ButtonProvider>
						</div>
					</CardProvider>
				) : (
					<CardProvider className='w-full'>
						<div className='w-full p-4 flex flex-col gap-4'>
							<div className='text-sm text-center'>Amount due</div>

							<div className='flex flex-col justify-center items-center gap-1'>
								<div className='text-4xl text-center font-bold'>$1,000.00</div>
								<div className='flex items-center justify-center justify-start gap-2'>
									<div className='flex items-center gap-1 text-sm'>
										<LockedIcon />
										0.04 BTC
									</div>
									<div className='text-sm'>($2,500)</div>
								</div>
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
							<ButtonProvider>Make Payment</ButtonProvider>
						</div>
					</CardProvider>
				)}
			</div>
		</div>
	);
}

export default LoanPage;
