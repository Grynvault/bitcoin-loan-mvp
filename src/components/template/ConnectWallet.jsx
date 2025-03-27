/** @format */

import React from 'react';
import Image from 'next/image';
import { BitcoinWalletIcon } from '../icon/icons';

function ConnectWallet({ handleConnectWallet }) {
	return (
		<div className='flex flex-col justify-center items-center gap-12'>
			<div className='w-[100px] opacity-70'>
				<BitcoinWalletIcon />
			</div>
			<button
				onClick={handleConnectWallet}
				className='py-2 px-8 text-lg border-2 flex items-center border-gray-700 rounded-lg font-semibold'>
				<Image
					src='/images/unisatlogo.jpeg'
					alt='Logo'
					width={32}
					height={32}
				/>
				Connect Wallet
			</button>
		</div>
	);
}

export default ConnectWallet;
