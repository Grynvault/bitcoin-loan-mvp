/** @format */

import React, { useState } from 'react';
import Image from 'next/image';
//Context import
import { useApp } from '@/context/AppContext';
//Components import
import ButtonProvider from '@/components/button/ButtonProvider';
import { BitcoinWalletIcon } from '@/components/icon/icons';

function ConnectWallet() {
	const { setUser } = useApp();
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
		<div className='p-8 w-full h-full justify-center items-center h-screen text-center flex flex-col gap-8'>
			<div className='flex flex-col justify-center items-center gap-12'>
				<div className='w-[100px] opacity-70'>
					<BitcoinWalletIcon />
				</div>
				<ButtonProvider
					loading={loading}
					onClick={connectWallet}>
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
		</div>
	);
}

export default ConnectWallet;
