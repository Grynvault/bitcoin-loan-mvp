/** @format */

/** @format */
import React from 'react';
//MUI Imports
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';

function PageLoading({ loading, text = 'Loading...', noOpacity = false }) {
	return (
		<Backdrop
			sx={{
				color: 'black',
				backdropFilter: 'blur(4px)',
				backgroundColor: noOpacity ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0.5)',
				zIndex: (theme) => theme.zIndex.drawer + 1,
			}}
			open={loading}
			onClick={() => {}}>
			<div className='flex flex-col gap-6 items-center justify-center'>
				<CircularProgress
					color='black'
					size={39}
					sx={{ color: 'black' }}
				/>
				<div className='font-semibold text-lg'>{text}</div>
			</div>
		</Backdrop>
	);
}

export default PageLoading;
