/** @format */

'use client';

import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
	const [btcNetwork, setBtcNetwork] = useState('testnet');
	const [user, setUser] = useState(null);

	return <AppContext.Provider value={{ btcNetwork, setBtcNetwork, user, setUser }}>{children}</AppContext.Provider>;
}

export function useApp() {
	return useContext(AppContext);
}
