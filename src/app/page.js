/** @format */
'use client';

import { useState } from 'react';
import Dashboard from '@/pages/Dashboard';
import ConnectWallet from '@/pages/ConnectWallet';
import { useApp } from '@/context/AppContext';

export default function Home() {
	return <Dashboard />;
}
