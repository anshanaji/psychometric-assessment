import React, { useState } from 'react';
import { useAssessment } from '../../context/AssessmentContext';

interface PaymentHandlerProps {
    amount?: string;
    onPaymentStart?: () => void;
}

const PaymentHandler: React.FC<PaymentHandlerProps> = ({ amount = "499", onPaymentStart }) => {
    const { userDetails } = useAssessment();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePayment = async () => {
        setLoading(true);
        setError(null);
        if (onPaymentStart) onPaymentStart();

        try {
            // Call our Firebase Function
            // Note: In development (npm run dev), this might need to point to localhost:5001 if using emulators,
            // or the deployed URL if using live functions. 
            // Since we setup rewrites in firebase.json, relative path '/api/createPayment' works *after deploy*.
            // For local dev without emulators, we need the full deployed function URL if functions are already deployed,
            // OR we just assume this will be tested on the deployed site.

            // Let's try relative path first, assuming this is tested on deployed site or with proxy.
            // If running locally with 'npm run dev' and no proxy, this will 404.
            // We'll use a hardcoded fallback for local dev to the production URL if window.location.hostname is localhost

            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            // replace with your actual project ID 'psychometric-app-d817b' if you know it, or just use relative if deployed
            const baseUrl = isLocal ? 'https://psychometric-app-d817b.web.app' : '';

            const response = await fetch(`${baseUrl}/api/createPayment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: userDetails.name || 'Guest User',
                    email: 'user@example.com', // In a real app, collect email
                    amount: amount
                }),
            });

            const data = await response.json();

            if (data.success && data.longurl) {
                window.location.href = data.longurl;
            } else {
                throw new Error(data.error || 'Failed to create payment link');
            }

        } catch (err: any) {
            console.error("Payment Error:", err);
            setError(err.message || "Something went wrong initiating payment.");
            setLoading(false);
        }
    };

    return (
        <div>
            {error && <p style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
            <button
                onClick={handlePayment}
                disabled={loading}
                className="payment-btn"
                style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 3rem',
                    fontSize: '1.2rem',
                    borderRadius: '50px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
                    transition: 'transform 0.2s',
                    opacity: loading ? 0.7 : 1
                }}
            >
                {loading ? 'Processing...' : `Unlock Full Report (₹${amount})`}
            </button>
        </div>
    );
};

export default PaymentHandler;
