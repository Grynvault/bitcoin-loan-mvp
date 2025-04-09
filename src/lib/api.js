/** @format */
import { useQuery } from '@tanstack/react-query';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabaseServer';

export const useUserData = () => {
	const { userAddress } = useApp();

	const { data, isLoading, isError } = useQuery({
		queryKey: ['userData', userAddress],
		queryFn: async () => {
			if (!userAddress) return null;

			// Try to find the user in Supabase
			let { data: user, error } = await supabase.from('users').select('*').eq('wallet_address', userAddress).single();

			// If user not found, create one
			if (error && error.code === 'PGRST116') {
				console.log('User not found, error ->', error);

				let userPubKey = null;

				try {
					let res = await window.unisat.getPublicKey();
					userPubKey = res;
				} catch (e) {
					console.log('Error getting user pubkey ->', e);
				}

				const { data: newUser, error: createError } = await supabase
					.from('users')
					.insert([{ wallet_address: userAddress, usd_balance: 0, pub_key: userPubKey }])
					.select()
					.single();

				if (createError) throw new Error(createError.message);
				return newUser;
			}

			if (error) throw new Error(error.message);

			return user;
		},
		enabled: !!userAddress, // only run if wallet is connected
		staleTime: 5 * 60 * 1000, // 5 minutes
		cacheTime: 10 * 60 * 1000, // 10 minutes
	});

	return {
		data,
		isLoading,
		isError,
	};
};

export const useUserLoan = () => {
	const { userAddress } = useApp();

	const { data, isLoading, isError } = useQuery({
		queryKey: ['userLoan', userAddress],
		queryFn: async () => {
			const { data, error } = await supabase.from('loans').select('*').eq('borrower_segwit_address', userAddress).neq('status', 'closed').single();

			if (error) throw new Error(error.message);
			return data;
		},
		enabled: !!userAddress,
		refetchOnWindowFocus: false,
	});

	return {
		data,
		isLoading: isLoading,
		isError,
	};
};

export const useUserBtcBalance = () => {
	const { userAddress } = useApp();
	const { data, isLoading, isError } = useQuery({
		queryKey: ['btcBalance'],
		queryFn: async () => {
			const res = await window.unisat.getBalance();
			return res.confirmed;
		},
		refetchInterval: 60000, // refresh every 60s
		enabled: !!userAddress,
	});

	return {
		data,
		isLoading,
		isError,
	};
};

export const useBtcPrice = () => {
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
