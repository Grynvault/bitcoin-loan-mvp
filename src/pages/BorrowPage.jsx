/** @format */
'use client';
import React, { useState } from 'react';
//MUI import
import Slider from '@mui/material/Slider';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
//Components import
import CardProvider from '@/components/card/CardProvider';
import ButtonProvider from '@/components/button/ButtonProvider';
import { ChevronDown } from '@/components/icon/icons';
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
	const [loadingStep1, setLoadingStep1] = useState(false);
	//Step 2 states
	const [btcCollateral, setBtcCollateral] = useState(null);
	const [initHtclAddress, setInitHtclAddress] = useState(null);

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

	const requestLoan = async () => {
		const userSegwitAddress = await connectUnisat();
		const userPubKey = await getPublicKey();
		const btcCollateral = calculateBtcCollateral() * 1e8;
		const loanAmount_ = loanAmount * 1e2;
		const loanToValue = 70;
		const btcPrice_ = btcPrice * 1e2;
		const loanDuration = days;

		const bodyToServer = {
			btc_collateral: btcCollateral,
			loan_amount: loanAmount_,
			loan_to_value: loanToValue,
			btc_price: btcPrice_,
			borrower_pub_key: userPubKey,
			borrower_segwit_address: userSegwitAddress,
			loan_duration: loanDuration,
		};

		console.log(bodyToServer);

		setLoadingStep1(true);

		try {
			const res = await fetch('/api/initiate-loan', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(bodyToServer),
			});

			const data = await res.json();
			console.log(data);
			setBtcCollateral(data.loan.btc_collateral);
			setInitHtclAddress(data.loan.init_htlc_address);
			setLoadingStep1(false);
			handleNext();
		} catch (e) {
			console.log('Error ->', e);
			setLoadingStep1(false);
		}
	};

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
								loading={loadingStep1}
								disabled={notEnoughFunds || loanAmount <= 0}
								onClick={requestLoan}>
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
								<div className='text-4xl font-semibold'>{(btcCollateral / 1e8).toFixed(8)} BTC</div>
							</div>
							<div className='text-center text-sm'>to {initHtclAddress} (P2SH)</div>
							<Accordion>
								<AccordionSummary
									expandIcon={<ChevronDown />}
									aria-controls='panel1-content'
									id='panel1-header'>
									<div>Scripts for the P2SH Address</div>
								</AccordionSummary>
								<AccordionDetails>
									<ScriptDisplay
										script={`OP_IF
  <timelock>
  OP_CHECKLOCKTIMEVERIFY
  OP_DROP
  <your public key>
  OP_CHECKSIG
OP_ELSE
  OP_SHA256
  <preimage>
  OP_EQUALVERIFY
  <grynvault public key>
  OP_CHECKSIG
OP_ENDIF`}
									/>
								</AccordionDetails>
							</Accordion>
							<div className='border border-gray-300 flex flex-col gap-1 p-3 rounded-md'>
								<div>
									<div className='flex flex-row justify-between items-center'>
										<div>Timelock</div>
										<div>Mon Mar 24 11:54 PM</div>
									</div>
									<div className='text-xs'>
										If Grynvault does not deposit the loan within timelock,
										<br /> the collateral can be unlocked by you
									</div>
								</div>
							</div>

							<ButtonProvider onClick={handleNext}>Deposit Collateral </ButtonProvider>
						</div>
					</CardProvider>
				)}
				{activeStep === 2 && (
					<CardProvider>
						<div className='flex flex-col gap-4 p-4'>
							<h1 className='text-center font-medium'>Loan is Ready!</h1>
							<div className='text-5xl text-center font-semibold'>${loanAmount}</div>
							<div>has been deposited to your account</div>{' '}
							<Accordion>
								<AccordionSummary
									expandIcon={<ChevronDown />}
									aria-controls='panel1-content'
									id='panel1-header'>
									<div>Scripts for the Collateral Address</div>
								</AccordionSummary>
								<AccordionDetails>
									<ScriptDisplay
										script={`OP_IF //if loan is not paid by due date (timelock)
  <timelock (due date + 5 days)>
  OP_CHECKLOCKTIMEVERIFY
  OP_DROP
  <grynvault public key>
  OP_CHECKSIG
OP_ELSE //if loan is paid
  OP_SHA256
  <preimage>
  OP_EQUALVERIFY
  <your public key>
  OP_CHECKSIG
OP_ENDIF`}
									/>
								</AccordionDetails>
							</Accordion>
							<div className='border border-gray-300 flex flex-col gap-1 p-3 rounded-md'>
								<div className='flex flex-row justify-between items-center'>
									<div>Loan-to-value (LTV)</div>
									<div>70%</div>
								</div>
								<div className='flex flex-row justify-between items-center'>
									<div>BTC Collateral</div>
									<div>{calculateBtcCollateral()} BTC</div>
								</div>
								<div className='flex flex-row gap-8 justify-between items-center'>
									<div>P2SH Collateral Address</div>
									<div>{calculateBtcCollateral()} BTC</div>
								</div>
								<div className='flex flex-row gap-8 justify-between items-center'>
									<div>Loan due date</div>
									<div>Tues, Mar 25 12:30 PM</div>
								</div>
								<div className='flex flex-row justify-between items-center'>
									<div>Fees in BTC</div>
									<div>0 BTC</div>
								</div>
							</div>
							<ButtonProvider>View Loan</ButtonProvider>
						</div>
					</CardProvider>
				)}
			</div>
		</div>
	);
}

function ScriptDisplay({ script }) {
	return <div className='bg-black text-green-400 font-mono text-sm p-4 rounded-lg overflow-x-auto whitespace-pre'>{script}</div>;
}

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
