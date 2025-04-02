/** @format */

import { supabase } from '@/lib/supabaseServer';

/**
 * Creates a new loan record in the database.
 *
 * @param {Object} data - Loan data to insert.
 * @param {number} data.btc_collateral - Amount of BTC collateral (in satoshis).
 * @param {number} data.loan_amount - Loan amount in fiat (e.g., USD cents).
 * @param {number} data.loan_to_value - Loan-to-value ratio (1–100).
 * @param {number} data.btc_price - Current BTC price in fiat (e.g., USD cents).
 * @param {string} data.borrower_pub_key - Borrower's public key.
 * @param {string} data.borrower_segwit_address - Borrower's SegWit address.
 * @param {number} data.loan_duration - Loan duration in days.
 * @param {number} data.total_loan_withdrawn - Amount already withdrawn.
 * @param {number} data.init_timelock - Initial HTLC locktime (unix timestamp).
 * @param {number} data.collateral_timelock - Collateral HTLC locktime (unix timestamp).
 * @param {string} data.init_preimage - Initial HTLC preimage to move the fund to collateral address.
 * @param {string} data.status - Status = initialize | deposit | ready | end
 * @param {string} data.init_htlc_address - Initial HTLC address to hold collateral temporarily
 * @param {string} data.collateral_htcl_address - Collateral HTLC address
 * @param {string} data.init_redeem_script_hex - Init Redeem Script in HEX
 * @returns {Promise<Object>} The inserted loan record.
 */
export async function initiateLoan({
	btc_collateral,
	loan_amount,
	loan_to_value,
	btc_price,
	borrower_pub_key,
	borrower_segwit_address,
	loan_duration,
	total_loan_withdrawn,
	init_timelock,
	collateral_timelock,
	init_preimage,
	status,
	init_htlc_address,
	collateral_htlc_address,
	init_redeem_script_hex,
}) {
	const { data, error } = await supabase
		.from('loans')
		.insert([
			{
				loan_amount: loan_amount,
				loan_to_value: loan_to_value,
				btc_price: btc_price,
				btc_collateral: btc_collateral,
				loan_duration: loan_duration,
				borrower_pub_key: borrower_pub_key,
				borrower_segwit_address: borrower_segwit_address,
				init_preimage: init_preimage,
				init_timelock: init_timelock,
				init_htlc_address: init_htlc_address,
				collateral_timelock: collateral_timelock,
				collateral_htlc_address: collateral_htlc_address,
				total_loan_withdrawn: total_loan_withdrawn,
				status: status,
				init_redeem_script_hex: init_redeem_script_hex,
			},
		])
		.select()
		.single();

	if (error) {
		throw new Error(error.message);
	}

	return data;
}

export async function getLoanById(loanId) {
	const { data, error } = await supabase.from('loans').select('*').eq('id', loanId).single();

	if (error) {
		throw new Error(error.message);
	}

	return data;
}

/**
 * Updates a loan by ID with the provided fields.
 *
 * @param {number} id - The ID of the loan to update
 * @param {Object} updates - {
 *
 *
 *  }
 *
 * @returns {Promise<Object>} The updated loan record
 */
export async function updateLoan(id, updates) {
	if (!id || isNaN(id)) {
		throw new Error('Invalid loan ID');
	}

	//Update loan first
	const { data: loanData, error: updateLoanError } = await supabase.from('loans').update(updates).eq('id', id).select().single();

	if (updateLoanError) {
		throw new Error(`Failed to update loan: ${error.message}`);
	}

	return loanData;
}

{
	/**
	 * 
	 * loan_duration: loan_duration,
		total_loan_withdrawn: 0,
		init_timelock: lockTime,
		init_htlc_address: address,
		status: 'finalized',
		collateral_timelock: lockTime,
		collateral_htlc_address: address,
		collateral_preimage: collateralPreimage,
		collateral_txhex: transactionToHex,
		loan_amount: loan_amount,
		borrower_pub_key: borrower_pub_key
		start_loan_txid: txid
	 */
}

export async function startLoan(id, updates) {
	if (!id || isNaN(id)) {
		throw new Error('Invalid loan ID');
	}

	console.log('updates ->', updates);

	//Update loan first
	const { data: loanData, error: updateLoanError } = await supabase.from('loans').update(updates).eq('id', id).select().single();

	if (updateLoanError) {
		throw new Error(`Failed to update loan: ${error.message}`);
	}

	//Get existing USD account balance
	const { data: accountData, error: getAccountError } = await supabase.from('users').select('id, usd_balance').eq('pub_key', updates.borrower_pub_key).single();

	if (getAccountError) {
		throw new Error(`Failed to get account: ${error.message}`);
	}

	const newBalance = Number(accountData.usd_balance || 0) + Number(updates.loan_amount || 0);

	console.log('newBalance ->', newBalance);

	// 💰 Update account with new balance
	const { data: updatedAccount, error: updateAccountError } = await supabase.from('users').update({ usd_balance: newBalance }).eq('id', accountData.id).select().single();

	if (updateAccountError) {
		throw new Error(`Failed to update account: ${updateAccountError.message}`);
	}

	return { loan: loanData, account: updatedAccount };
}
