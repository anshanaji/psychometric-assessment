import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAssessment } from '../../context/AssessmentContext';

const PaymentCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { unlockReport } = useAssessment();
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [message, setMessage] = useState('Verifying your payment...');

    useEffect(() => {
        const paymentId = searchParams.get('payment_id');
        const paymentRequestId = searchParams.get('payment_request_id');

        if (!paymentId || !paymentRequestId) {
            setStatus('failed');
            setMessage('Invalid payment details received.');
            return;
        }

        const verify = async () => {
            try {
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                const baseUrl = isLocal ? 'https://psychometric-app-d817b.web.app' : '';

                const response = await fetch(`${baseUrl}/api/verifyPayment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ payment_id: paymentId, payment_request_id: paymentRequestId })
                });

                const data = await response.json();

                if (data.success) {
                    setStatus('success');
                    setMessage('Payment successful! Unlocking your report...');
                    unlockReport();
                    setTimeout(() => {
                        navigate('/'); // Redirect to dashboard which should now show full report
                    }, 2000);
                } else {
                    setStatus('failed');
                    setMessage(data.message || 'Payment verification failed.');
                }
            } catch (error) {
                console.error("Verification Error:", error);
                setStatus('failed');
                setMessage('Server error during verification. Please contact support.');
            }
        };

        verify();
    }, [searchParams, unlockReport, navigate]);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>

            {status === 'verifying' && (
                <>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                    <h2>Verifying Payment...</h2>
                    <p>{message}</p>
                </>
            )}

            {status === 'success' && (
                <>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                    <h2 style={{ color: 'green' }}>Success!</h2>
                    <p>{message}</p>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>Redirecting you to your report...</p>
                </>
            )}

            {status === 'failed' && (
                <>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                    <h2 style={{ color: 'red' }}>Payment Failed</h2>
                    <p>{message}</p>
                    <button
                        onClick={() => navigate('/')}
                        style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        Return to Home
                    </button>
                    <p style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                        If money was deducted, please contact support with your Payment ID: {searchParams.get('payment_id')}
                    </p>
                </>
            )}
        </div>
    );
};

export default PaymentCallback;
