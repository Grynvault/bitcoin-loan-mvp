/** @format */

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const AppContext = createContext();

export function AppProvider({ children }) {
	const [btcNetwork, setBtcNetwork] = useState('testnet');
	const [user, setUser] = useState(null);
	const [userAddress, setUserAddress] = useState(null);
	const [loadingWalet, setLoadingWallet] = useState(true);

	const router = useRouter();

	// ✅ Helper to validate address and network
	const validateWallet = async (address) => {
		const isSegwitP2WPKH = address?.startsWith('bc1q') || address?.startsWith('tb1q');
		const network = await window.unisat.getNetwork(); // 'livenet', 'testnet'

		if (!isSegwitP2WPKH) {
			alert('Please connect with a P2WPKH SegWit address (tb1q...).');
			router.push('/');
			return false;
		}

		if (network !== 'testnet') {
			alert('Please switch to Bitcoin Testnet 3 in Unisat Wallet.');
			router.push('/');
			return false;
		}

		return true;
	};

	useEffect(() => {
		const autoConnect = async () => {
			if (typeof window !== 'undefined' && window.unisat) {
				try {
					const accounts = await window.unisat.getAccounts();
					const address = accounts[0];

					if (accounts.length > 0) {
						const valid = await validateWallet(address);
						if (valid) {
							setUserAddress(address);
						}
					}
				} catch (err) {
					console.log('Auto-connect failed:', err.message);
					router.push('/');
				}
			} else {
				router.push('/');
			}
			setLoadingWallet(false);
		};
		autoConnect();
	}, []);

	const connectWallet = async () => {
		if (!window.unisat) {
			alert('Please install the Unisat Wallet extension.');
			return;
		}

		setLoadingWallet(true);
		try {
			const accounts = await window.unisat.requestAccounts();
			const address = accounts[0];

			const valid = await validateWallet(address);
			if (valid) {
				setUserAddress(address);
			}
		} catch (err) {
			console.error('Wallet connect error:', err);
		}
		setLoadingWallet(false);
	};

	return (
		<AppContext.Provider
			value={{
				btcNetwork,
				setBtcNetwork,
				user,
				setUser,
				userAddress,
				setUserAddress,
				connectWallet,
				loadingWalet,
			}}>
			{children}
		</AppContext.Provider>
	);
}

export function useApp() {
	return useContext(AppContext);
}
