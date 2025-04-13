/** @format */
'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import ButtonProvider from '@/components/button/ButtonProvider';
import ConnectWallet from '@/components/template/ConnectWallet';
import { shortenAddress } from '@/lib/util';

function Topbar() {
	const { userAddress } = useApp();
	const { connectWallet, loadingWalet } = useApp();

	let router = useRouter();

	return (
		<div className='flex items-center justify-between py-2 pr-6 pl-3'>
			<div
				className='cursor-pointer'
				onClick={() => router.push('/')}>
				<Image
					src='/images/grynvault_banner.png'
					alt='Logo'
					width={260}
					height={10}
				/>
			</div>

			{userAddress ? (
				<div className='text-sm border px-2 py-2 rounded-lg border-2 font-semibold w-fit'>{shortenAddress(userAddress, 8, 8)}</div>
			) : (
				<ButtonProvider
					loading={loadingWalet}
					onClick={connectWallet}>
					<div className='flex text-sm items-center font-semibold'>
						<Image
							src='/images/unisatlogo.jpeg'
							alt='Logo'
							width={32}
							height={32}
						/>
						Connect Wallet
					</div>
				</ButtonProvider>
			)}
		</div>
	);
}

export default Topbar;
