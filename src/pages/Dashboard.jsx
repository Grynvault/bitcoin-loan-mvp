/** @format */

import React from 'react';
import { useRouter } from 'next/navigation';
//Context import
import { useApp } from '@/context/AppContext';
//Components import
import ButtonProvider from '@/components/button/ButtonProvider';
import CardProvider from '@/components/card/CardProvider';
//API
import { useUserBtcBalance } from '@/lib/api';

export default function Dashboard() {
	const router = useRouter();
	const { user } = useApp();
	const { data: btcBalance, isLoading, isError } = useUserBtcBalance();
	return (
		<div className='py-14 px-4 md:p-7 flex flex-col gap-12'>
			<div className='flex flex-col gap-2'>
				<h1 className='text-4xl font-bold'>Dashboard</h1>
				<div className='text-xs border px-2 py-1 rounded-full w-fit'>{user}</div>
			</div>
			<div className='flex flex-wrap gap-4'>
				<CardProvider>
					<div className='flex flex-col gap-2 p-4'>
						<div>Loan</div>
						<ButtonProvider onClick={() => router.push('/borrow')}>Initiate Loan</ButtonProvider>
					</div>
				</CardProvider>
				<CardProvider>
					<div className='flex flex-col gap-2 p-4'>
						<div>USD Balance:</div>
						<h2 className='font-bold text-xl'>$ 0.00</h2>
					</div>
				</CardProvider>
				<CardProvider>
					<div className='flex flex-col gap-2 p-4'>
						<div>BTC Balance:</div>
						<h2 className='font-bold text-xl'>{isLoading ? 'Loading...' : (btcBalance / 1e8).toFixed(6)} BTC</h2>
					</div>
				</CardProvider>
			</div>
		</div>
	);
}
