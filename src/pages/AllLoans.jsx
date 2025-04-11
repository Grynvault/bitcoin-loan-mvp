/** @format */

'use client';

import React, { useState } from 'react';
import { useUserLoanList } from '@/lib/api';
import { shortenAddress, formatUnix, getTimeLeft, formatUsd, formatUnixDateWithOrdinal } from '@/lib/util';

function AllLoans() {
	const { data: userLoanList, isLoading: isUserLoanListLoading } = useUserLoanList();

	if (userLoanList)
		return (
			<div className='py-14 px-4 md:p-10 flex flex-col w-full gap-6'>
				<div className='flex flex-row items-center justify-between w-full gap-2'>
					<h1 className='text-3xl font-bold'>Previous Loans</h1>
				</div>
				<div className='flex flex-col gap-2 border rounded-lg p-3'>
					<div className='grid grid-cols-4 gap-1 font-semibold pb-1'>
						<div>Loan</div>
						<div>BTC Collateral</div>
						<div>Duration</div>
						<div className='text-end'>End at</div>
					</div>
					{userLoanList?.map((loan) => (
						<div
							key={loan.id}
							className='grid grid-cols-4 gap-1'>
							<div>{formatUsd(loan.loan_amount)}</div>
							<div>{(loan.btc_collateral * 1e-8).toFixed(6)} BTC</div>
							<div>{loan.loan_duration} hrs</div>
							<div className='text-end'>{formatUnix(loan.paid_at_timestamp)}</div>
						</div>
					))}
				</div>
			</div>
		);
	else return null;
}

export default AllLoans;
