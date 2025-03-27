/** @format */

import { useQuery } from '@tanstack/react-query';
import { useApp } from '@/context/AppContext';

export const useUserBtcBalance = () => {
	const { user } = useApp();
	const { data, isLoading, isError } = useQuery({
		queryKey: ['btcBalance'],
		queryFn: async () => {
			const res = await window.unisat.getBalance();
			return res.confirmed;
		},
		refetchInterval: 60000, // refresh every 60s
		enabled: !!user,
	});

	return {
		data,
		isLoading,
		isError,
	};
};

export const useBtcPrice = () => {
	const { user } = useApp();

	const { data, isLoading, isError } = useQuery({
		queryKey: ['btcPrice'],
		queryFn: async () => {
			const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
			const data = await res.json();
			return data.bitcoin.usd;
		},
		refetchInterval: 500000, // refresh every 60s
	});

	return {
		data,
		isLoading,
		isError,
	};
};
