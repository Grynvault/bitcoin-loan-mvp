/** @format */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
//MUI import
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
//Components import
import { useApp } from '@/context/AppContext';

const drawerWidth = 240;

export default function Sidebar(props) {
	const { window } = props;
	const { user } = useApp();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [isClosing, setIsClosing] = useState(false);

	const pathname = usePathname();

	const navItems = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/borrow', label: 'Borrow' },
		{ href: '/loan', label: 'Loan' },
		{ href: '/transaction', label: 'Transaction' },
	];

	const handleDrawerClose = () => {
		setIsClosing(true);
		setMobileOpen(false);
	};

	const handleDrawerTransitionEnd = () => {
		setIsClosing(false);
	};

	const handleDrawerToggle = () => {
		if (!isClosing) {
			setMobileOpen(!mobileOpen);
		}
	};

	const drawer = (
		<div className='flex py-8 px-4 flex-col gap-4'>
			{navItems.map((item) => (
				<Link
					key={item.href}
					href={item.href}
					className={`text-base ${pathname === item.href ? 'font-bold text-blue-600' : 'text-gray-600'}`}>
					{item.label}
				</Link>
			))}
		</div>
	);

	if (!user) return null;

	return (
		<>
			<AppBar
				position='fixed'
				sx={{
					width: { sm: `calc(100% - ${drawerWidth}px)` },
					ml: { sm: `${drawerWidth}px` },
					backgroundColor: 'transparent',
					boxShadow: 'none',
				}}>
				<Toolbar>
					<IconButton
						color='inherit'
						aria-label='open drawer'
						edge='start'
						onClick={handleDrawerToggle}
						sx={{ mr: 2, display: { sm: 'none' } }}>
						<MenuIcon />
					</IconButton>
				</Toolbar>
			</AppBar>
			<Box
				component='nav'
				sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
				aria-label='mailbox folders'>
				{/* The implementation can be swapped with js to avoid SEO duplication of links. */}
				<Drawer
					variant='temporary'
					open={mobileOpen}
					onTransitionEnd={handleDrawerTransitionEnd}
					onClose={handleDrawerClose}
					sx={{
						display: { xs: 'block', sm: 'none' },
						'& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
					}}
					slotProps={{
						root: {
							keepMounted: true, // Better open performance on mobile.
						},
					}}>
					{drawer}
				</Drawer>
				<Drawer
					variant='permanent'
					sx={{
						display: { xs: 'none', sm: 'block' },
						'& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
					}}
					open>
					{drawer}
				</Drawer>
			</Box>
		</>
	);
}

/**
 *
 *
 * Icons
 *
 */
const MenuIcon = () => (
	<svg
		xmlns='http://www.w3.org/2000/svg'
		fill='none'
		viewBox='0 0 24 24'
		strokeWidth={1.5}
		stroke='black'
		className='size-6'>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
		/>
	</svg>
);
