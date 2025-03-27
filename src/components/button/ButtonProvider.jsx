/** @format */

import React from 'react';
//MUI import
import CircularProgress from '@mui/material/CircularProgress';

function ButtonProvider({ children, loading = false, disabled = false, ...props }) {
	const buttonStyle = {
		backgroundColor: props.backgroundColor || '#fff',
		borderRadius: props.borderRadius || '8px',
		padding: props.padding || '8px 12px',
		border: props.border || '2px solid black',
		color: props.color || '#000',
	};

	return (
		<button
			disabled={disabled}
			style={loading || disabled ? { opacity: 0.5, ...buttonStyle } : buttonStyle}
			className={`
        ${
					disabled
						? 'cursor-not-allowed'
						: 'cursor-pointer transition-transform duration-150 ease-in-out hover:-translate-y-1 hover:shadow-lg active:translate-y-0.5 active:shadow-sm'
				} flex items-center gap-2  text-center justify-center`}
			{...props}>
			<div className='relative inline-flex items-center justify-center'>
				{loading && (
					<div className='absolute inset-0 flex items-center justify-center bg-white/60 z-10 rounded'>
						<CircularProgress
							size={20}
							sx={{ color: props.color }}
						/>
					</div>
				)}
				{children}
			</div>
		</button>
	);
}

export default ButtonProvider;
