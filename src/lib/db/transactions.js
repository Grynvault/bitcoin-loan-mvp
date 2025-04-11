/** @format */

import { supabase } from '@/lib/supabaseServer';

/**
 * 
 * create table public.transactions (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  txid text null,
  status text null,
  amount bigint null,
  user_wallet_address text null,
  type text null,
  details jsonb null,
  currency text null,
  constraint transactions_pkey primary key (id)
) TABLESPACE pg_default;
 */

export async function addTransaction({ txid = null, status, amount, user_wallet_address, type, details = {}, currency }) {
	const { data, error } = await supabase
		.from('transactions')
		.insert([
			{
				txid,
				status,
				amount,
				user_wallet_address,
				type,
				details,
				currency,
			},
		])
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to add transaction: ${error.message}`);
	}

	return data;
}

export async function updateTransaction(id, updates) {
	if (!id || isNaN(id)) {
		throw new Error('Invalid transaction ID');
	}

	const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).select().single();

	if (error) {
		throw new Error(`Failed to update transaction: ${error.message}`);
	}

	return data;
}
