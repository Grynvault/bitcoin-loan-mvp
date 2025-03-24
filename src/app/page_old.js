/** @format */
'use client';

import { useState } from 'react';
import LoanCreation from '../pages/LoanCreation';
//MUI Imports
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Image from 'next/image';

export default function Home() {
	const [account, setAccount] = useState(null);
	const [step, setStep] = useState(1);
	const [value, setValue] = useState(0);

	const handleChange = (event, newValue) => {
		setValue(newValue);
	};

	return (
		<Box sx={{ width: '100%' }}>
			<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
				<Tabs
					value={value}
					onChange={handleChange}
					aria-label='basic tabs example'>
					<Tab
						label='Create Loan'
						{...a11yProps(0)}
					/>
					<Tab
						label='Pay Loan'
						{...a11yProps(1)}
					/>
				</Tabs>
			</Box>
			<CustomTabPanel
				value={value}
				index={0}>
				<LoanCreation
					account={account}
					step={step}
					setStep={setStep}
				/>
			</CustomTabPanel>
			<CustomTabPanel
				value={value}
				index={1}>
				<div>Hello</div>
			</CustomTabPanel>
		</Box>
	);
}

/**
 *
 * Components
 *
 */
function CustomTabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role='tabpanel'
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			{...other}>
			{value === index && <Box sx={{ p: 3 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index) {
	return {
		id: `simple-tab-${index}`,
		'aria-controls': `simple-tabpanel-${index}`,
	};
}
