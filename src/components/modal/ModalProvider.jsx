/** @format */
import React from 'react';
import Slide from '@mui/material/Slide';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import { CloseIcon } from '../icon/icons';

const Transition = React.forwardRef(function Transition(props, ref) {
	return (
		<Slide
			direction='up'
			ref={ref}
			{...props}
		/>
	);
});

export default function ModalProvider({ open, title = 'Pay Loan', handleClose = () => {}, closeAction = true, children, ...props }) {
	return (
		<Dialog
			open={open}
			onClose={handleClose}
			TransitionComponent={Transition}
			aria-labelledby='dialog-title'
			aria-describedby='dialog-description'
			PaperProps={{
				sx: {
					display: 'flex',
					flexDirection: 'column',
					borderRadius: '8px',
					width: '100%',
				},
				p: 4,
			}}
			{...props}>
			<Box>
				<DialogTitle
					id='dialog-title'
					sx={{ padding: 0, top: 0, backgroundColor: 'white' }}>
					<div className='flex items-center px-4 py-3 justify-between'>
						<div className='w-[24px]'></div>
						<div className='text-base font-medium'>{title}</div>
						<div
							className='cursor-pointer w-[24px]'
							onClick={() => {
								handleClose();
							}}>
							<CloseIcon />
						</div>
					</div>
				</DialogTitle>
				<div>{children}</div>
			</Box>
		</Dialog>
	);
}
