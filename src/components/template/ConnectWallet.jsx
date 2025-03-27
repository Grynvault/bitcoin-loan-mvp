/** @format */

import React from 'react';
import Image from 'next/image';
import { BitcoinWalletIcon } from '../icon/icons';
import ButtonProvider from '../button/ButtonProvider';

function ConnectWallet({ handleConnectWallet, isLoading }) {
	return (
		<div className='flex flex-col h-full justify-center items-center gap-6'>
			<div className='w-[80px] opacity-70'>
				<BitcoinWalletIcon />
			</div>
			<ButtonProvider
				loading={isLoading}
				onClick={handleConnectWallet}>
				<div className='flex items-center font-semibold'>
					<Image
						src='/images/unisatlogo.jpeg'
						alt='Logo'
						width={32}
						height={32}
					/>
					Connect Wallet
				</div>
			</ButtonProvider>
		</div>
	);
}

export default ConnectWallet;
