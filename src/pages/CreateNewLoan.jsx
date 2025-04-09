/** @format */

'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
//MUI import
import Slider from '@mui/material/Slider';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
//Components import
import CardProvider from '@/components/card/CardProvider';
import ButtonProvider from '@/components/button/ButtonProvider';
import PageLoading from '@/components/loading/PageLoading';
//Lib
import { useUserBtcBalance, useBtcPrice } from '@/lib/api';

function valuetext(value) {
	return `${value}`;
}

const steps = ['Request Loan', 'Deposit BTC Collateral', 'Initiate Loan', 'Loan is Ready'];

function CreateNewLoan() {
	const { data: btcBalance, isLoading: btcBalanceIsLoading } = useUserBtcBalance();
	const { data: btcPrice, isLoading: btcPriceIsLoading } = useBtcPrice();
	//Step 1 (Initiaze Loan) states
	const [activeStep, setActiveStep] = useState(0);
	const [loanAmount, setLoanAmount] = useState(10);
	const [days, setDays] = useState(2);
	const [loading, setLoading] = useState(false);

	let route = useRouter();

	const handleChangeDays = (event, newValue) => {
		setDays(newValue);
	};

	const calculateBtcCollateral = () => {
		const collateralInUSD = loanAmount * (10 / 7);
		const collateralInBTC = collateralInUSD / btcPrice;
		return collateralInBTC.toFixed(8);
	};

	const notEnoughFunds = calculateBtcCollateral() > btcBalance / 1e8;

	const requestLoan = async () => {
		const userSegwitAddress = await connectUnisat();
		const userPubKey = await getPublicKey();
		const btcCollateral = calculateBtcCollateral() * 1e8;
		const loanAmount_ = loanAmount * 1e2;
		const loanToValue = 70;
		const btcPrice_ = btcPrice * 1e2;
		const loanDuration = days;

		const bodyToServer = {
			btc_collateral: btcCollateral.toFixed(0),
			loan_amount: loanAmount_,
			loan_to_value: loanToValue,
			btc_price: btcPrice_,
			borrower_pub_key: userPubKey,
			borrower_segwit_address: userSegwitAddress,
			loan_duration: loanDuration,
		};

		setLoading(true);

		try {
			const res = await fetch('/api/request-loan', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(bodyToServer),
			});

			const data = await res.json();
			console.log('data from server ->', data);
			route.push(`/create-loan/${data.loan.id}`);
			setLoading(false);
		} catch (e) {
			console.log('Error initiating loan ->', e);
			setLoading(false);
		}
	};

	return (
		<div className='py-14 px-4 md:p-7 flex flex-col justify-center gap-8 w-full'>
			<PageLoading loading={loading} />

			<h1 className='text-4xl font-bold'>Borrowing</h1>
			<div className='w-full flex flex-col justify-center items-center gap-10'>
				<Stepper activeStep={activeStep}>
					{steps.map((label, index) => {
						const stepProps = {};
						const labelProps = {};
						return (
							<Step
								key={label}
								{...stepProps}>
								<StepLabel {...labelProps}>{label}</StepLabel>
							</Step>
						);
					})}
				</Stepper>
				<CardProvider>
					<div className='flex flex-col gap-4 p-4'>
						<h1 className='text-center font-medium'>Borrow</h1>
						<div className='relative w-fit'>
							<span className='absolute left-3 top-1/2 -translate-y-1/2 text-5xl text-gray-500 font-medium'>$</span>
							<input
								className='text-center max-w-[320px] text-5xl font-semibold'
								type='text'
								placeholder='10.00'
								min='0'
								value={loanAmount}
								onChange={(e) => {
									const value = e.target.value;
									const sanitized = value.replace(/[^0-9.]/g, '');
									setLoanAmount(sanitized);
								}}
							/>
						</div>
						<div className={`${notEnoughFunds ? 'text-red-600' : 'text-gray-600'} text-center text-sm`}>
							BTC Available: {btcBalanceIsLoading ? 'Loading...' : (btcBalance / 1e8).toFixed(8)} BTC
						</div>
						<div>
							<div>How long is the loan?</div>
							<div className='flex flex-row justify-center items-center gap-2'>
								<Slider
									aria-label='Days'
									defaultValue={7}
									value={days}
									onChange={handleChangeDays}
									getAriaValueText={valuetext}
									valueLabelDisplay='auto'
									shiftStep={1}
									step={1}
									marks
									min={1}
									max={7}
								/>
								<div className='whitespace-nowrap'>{days} hours</div>
							</div>
						</div>
						<div className='border border-gray-300 flex flex-col gap-1 p-3 rounded-md'>
							<div className='flex flex-row justify-between items-center'>
								<div>Loan-to-value (LTV)</div>
								<div>70%</div>
							</div>
							<div className='flex flex-row justify-between items-center'>
								<div>Current BTC Price</div>
								<div>
									{btcPriceIsLoading
										? 'Loading..'
										: btcPrice?.toLocaleString('en-US', {
												style: 'currency',
												currency: 'USD',
										  })}
								</div>
							</div>
							<div className='flex flex-row justify-between items-center'>
								<div>BTC Collateral</div>
								<div>{calculateBtcCollateral()} BTC</div>
							</div>
							<div className='flex flex-row justify-between items-center'>
								<div>Fees in BTC</div>
								<div>0 BTC</div>
							</div>
						</div>
						<ButtonProvider
							loading={loading}
							disabled={notEnoughFunds || loanAmount <= 0}
							onClick={requestLoan}>
							Continue
						</ButtonProvider>
					</div>
				</CardProvider>
			</div>
		</div>
	);
}

export default CreateNewLoan;

/***
 *
 * Unisat Wallet
 *
 */

const connectUnisat = async () => {
	if (!window.unisat) {
		alert('Please install the Unisat Wallet extension.');
		return;
	}
	try {
		const accounts = await window.unisat.requestAccounts();
		return accounts[0];
	} catch (error) {
		console.error('Connection error:', error);
	}
};

const getPublicKey = async () => {
	try {
		let res = await window.unisat.getPublicKey();
		console.log(res);
		return res;
	} catch (e) {
		console.log(e);
	}
};
