/** @format */
'use client';
import ContinueNewLoan from '@/pages/ContinueNewLoan';
import { useParams } from 'next/navigation';

function ContinueNewLoanPage() {
	const { loanId } = useParams();

	return <ContinueNewLoan loanId={loanId} />;
}

export default ContinueNewLoanPage;
