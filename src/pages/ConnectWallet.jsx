/** @format */

import React, { useState } from 'react';
//Context import
import { useApp } from '@/context/AppContext';
//Components import
import ButtonProvider from '@/components/button/ButtonProvider';

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
			<h1 className='text-4xl font-semibold'>Welcome to Grynvault</h1>
			<ButtonProvider
				loading={loading}
				onClick={connectWallet}>
				Connect Unisat Wallet
			</ButtonProvider>
		</div>
	);
}

export default ConnectWallet;
