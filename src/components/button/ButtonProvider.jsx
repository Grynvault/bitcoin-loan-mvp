/** @format */

import React from 'react';
//MUI import
import CircularProgress from '@mui/material/CircularProgress';

function ButtonProvider({ children, loading = false, disabled = false, ...props }) {
	return (
		<button
			disabled={disabled}
			style={loading || disabled ? { opacity: 0.5 } : {}}
			className={`px-4 py-2 rounded-full bg-blue-600 text-white font-semibold 
        ${
					disabled
						? 'cursor-not-allowed'
						: 'cursor-pointer transition-transform duration-150 ease-in-out hover:-translate-y-1 hover:shadow-lg active:translate-y-0.5 active:shadow-sm'
				} flex items-center gap-2  text-center justify-center`}
			{...props}>
			{loading && <CircularProgress size={20} />}
			{children}
		</button>
	);
}

export default ButtonProvider;
