/** @format */

import React from 'react';
//Context import
import { useApp } from '@/context/AppContext';
//Components import
import ButtonProvider from '@/components/button/ButtonProvider';

function Dashboard() {
	const { user } = useApp();

	return (
		<div className='py-14 px-4 md:p-7 flex flex-col gap-12'>
			<div className='flex flex-col gap-2'>
				<h1 className='text-4xl font-bold'>Dashboard</h1>
				<div className='text-xs border px-2 py-1 rounded-full'>{user}</div>
			</div>
			<div className='flex flex-wrap gap-4'>
				<CardProvider>
					<div className='flex flex-col gap-2 p-4'>
						<div>Loan</div>
						<ButtonProvider>Initiate Loan</ButtonProvider>
					</div>
				</CardProvider>
			</div>
		</div>
	);
}

export default Dashboard;

const CardProvider = ({ children, ...props }) => {
	const cardStyle = {
		backgroundColor: props.backgroundColor || '#fff',
		boxShadow: props.boxShadow || ' 0 2px 4px rgba(0, 0, 0, 30%)',
		borderRadius: props.borderRadius || '8px',
	};

	return <div style={cardStyle}>{children}</div>;
};
