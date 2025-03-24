/** @format */
'use client';

import { useState } from 'react';
import Dashboard from '@/pages/Dashboard';
import ConnectWallet from '@/pages/ConnectWallet';
import { useApp } from '@/context/AppContext';

export default function Home() {
	const { user } = useApp();

	if (!user) return <ConnectWallet />;
	else return <Dashboard />;
}
