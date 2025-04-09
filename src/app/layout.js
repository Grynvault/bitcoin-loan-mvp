/** @format */

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ReactQueryProvider } from '@/lib/ReactQueryProvider';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AppProvider, useApp } from '@/context/AppContext';
import Sidebar from '@/components/sidebar/Sidebar';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata = {
	title: 'Grynvault Self-Custody Bitcoin Finance',
	description: 'Grynvault Self-Custody Bitcoin Finance',
};

export default function RootLayout({ children }) {
	return (
		<html lang='en'>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<ReactQueryProvider>
					<AppProvider>
						<div className='flex justify-center w-full'>
							<div className='max-w-[1200px] w-full'>{children}</div>
						</div>
						<ReactQueryDevtools initialIsOpen={false} />
					</AppProvider>
				</ReactQueryProvider>
			</body>
		</html>
	);
}
