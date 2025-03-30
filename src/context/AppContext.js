/** @format */

'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
	const [btcNetwork, setBtcNetwork] = useState('testnet');
	const [user, setUser] = useState(null);
	const [userAddress, setUserAddress] = useState(null);
	const [loadingWalet, setLoadingWallet] = useState(true);

	useEffect(() => {
		const autoConnect = async () => {
			if (typeof window !== 'undefined' && window.unisat) {
				try {
					const accounts = await window.unisat.getAccounts();
					if (accounts.length > 0) {
						setUserAddress(accounts[0]);
					}
				} catch (err) {
					console.log('Auto-connect failed:', err.message);
				}
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
			setUserAddress(accounts[0]);
		} catch (err) {
			console.error('Wallet connect error:', err);
		}
		setLoadingWallet(false);
	};

	return <AppContext.Provider value={{ btcNetwork, setBtcNetwork, user, setUser, userAddress, setUserAddress, connectWallet, loadingWalet }}>{children}</AppContext.Provider>;
}

export function useApp() {
	return useContext(AppContext);
}
