/** @format */

import React from 'react';
//MUI import
import CircularProgress from '@mui/material/CircularProgress';

function ButtonProvider({ children, loading = false, ...props }) {
	return (
		<button
			className='px-8 py-2 rounded-full bg-blue-600 text-white font-semibold 
        transition-transform duration-150 ease-in-out
        hover:-translate-y-1 hover:shadow-lg
        active:translate-y-0.5 active:shadow-sm flex items-center gap-2 cursor-pointer'
			{...props}>
			{loading && <CircularProgress size={20} />}
			<div>{children}</div>
		</button>
	);
}

export default ButtonProvider;
