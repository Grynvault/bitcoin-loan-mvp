/** @format */

export default function CardProvider({ children, ...props }) {
	const cardStyle = {
		backgroundColor: props.backgroundColor || '#fff',
		boxShadow: props.boxShadow || ' 0 2px 4px rgba(0, 0, 0, 30%)',
		borderRadius: props.borderRadius || '8px',
		maxWidth: props.maxWidth || '420px',
	};

	return <div style={cardStyle}>{children}</div>;
}
