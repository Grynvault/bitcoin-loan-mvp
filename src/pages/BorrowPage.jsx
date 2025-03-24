/** @format */
'use client';
import React, { useState } from 'react';
//MUI import
import Slider from '@mui/material/Slider';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
//Components import
import CardProvider from '@/components/card/CardProvider';
import ButtonProvider from '@/components/button/ButtonProvider';
//API
import { useUserBtcBalance, useBtcPrice } from '@/lib/api';

function valuetext(value) {
	return `${value}`;
}
const steps = ['Initialize Loan', 'Deposit BTC Collateral', 'Loan is Ready'];

export default function BorrowPage() {
	const { data: btcBalance, isLoading: btcBalanceIsLoading } = useUserBtcBalance();
	const { data: btcPrice, isLoading: btcPriceIsLoading } = useBtcPrice();
	const [activeStep, setActiveStep] = useState(0);
	//Step 1 states
	const [loanAmount, setLoanAmount] = useState(10);
	const [days, setDays] = useState(2);

	const handleChangeDays = (event, newValue) => {
		setDays(newValue);
	};

	const handleNext = () => {
		setActiveStep((prevActiveStep) => prevActiveStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevActiveStep) => prevActiveStep - 1);
	};

	const calculateBtcCollateral = () => {
		const collateralInUSD = loanAmount * (10 / 7);
		const collateralInBTC = collateralInUSD / btcPrice;
		return collateralInBTC.toFixed(8);
	};

	const notEnoughFunds = calculateBtcCollateral() > btcBalance / 1e8;

	return (
		<div className='py-14 px-4 md:p-7 flex flex-col justify-center gap-8 w-full'>
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
				{activeStep === 0 && (
					<CardProvider>
						<div className='flex flex-col gap-4 p-4'>
							<h1 className='text-center font-medium'>Borrow</h1>
							<div className='flex flex-row justify-center items-center gap-2'>
								<div className='text-5xl font-semibold'>$</div>
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
									<div className='whitespace-nowrap'>{days} days</div>
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
											: btcPrice.toLocaleString('en-US', {
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
								disabled={notEnoughFunds || loanAmount <= 0}
								onClick={handleNext}>
								Continue
							</ButtonProvider>
						</div>
					</CardProvider>
				)}
				{activeStep === 1 && (
					<CardProvider>
						<div className='flex flex-col gap-4 p-4'>
							<h1 className='text-center font-medium'>Deposit Collateral</h1>
							<div className='flex flex-row justify-center items-center gap-2'>
								<div className='text-5xl font-semibold'>$</div>
								<input
									className='text-center max-w-[320px] text-5xl font-semibold'
									type='text'
									placeholder='10.00'
									value={loanAmount}
									onChange={(e) => setLoanAmount(e.target.value)}
								/>
							</div>
							<div className='text-center text-sm'>BTC Available: {btcBalanceIsLoading ? 'Loading...' : (btcBalance / 1e8).toFixed(8)} BTC</div>
							<div>
								<div>How long is the loan?</div>
								<div className='flex flex-row justify-center items-center gap-4'>
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
									<div className='whitespace-nowrap'>{days} days</div>
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
											: btcPrice.toLocaleString('en-US', {
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
							<ButtonProvider onClick={handleNext}>Continue</ButtonProvider>
						</div>
					</CardProvider>
				)}
				{activeStep === 2 && (
					<CardProvider>
						<div className='flex flex-col gap-4 p-4'>
							<h1 className='text-center font-medium'>Loan is Ready</h1>
							<div className='flex flex-row justify-center items-center gap-2'>
								<div className='text-5xl font-semibold'>$</div>
								<input
									className='text-center max-w-[320px] text-5xl font-semibold'
									type='text'
									placeholder='10.00'
									value={loanAmount}
									onChange={(e) => setLoanAmount(e.target.value)}
								/>
							</div>
							<div className='text-center text-sm'>BTC Available: {btcBalanceIsLoading ? 'Loading...' : (btcBalance / 1e8).toFixed(8)} BTC</div>
							<div>
								<div>How long is the loan?</div>
								<div className='flex flex-row justify-center items-center gap-4'>
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
									<div className='whitespace-nowrap'>{days} days</div>
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
											: btcPrice.toLocaleString('en-US', {
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
							<ButtonProvider>Continue</ButtonProvider>
						</div>
					</CardProvider>
				)}
			</div>
		</div>
	);
}
