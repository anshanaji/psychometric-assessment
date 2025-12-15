import React, { useState } from 'react';

interface PaymentModalProps {
    onCancel: () => void;
    onPaymentSuccess?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onCancel, onPaymentSuccess }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [unlockCodeInput, setUnlockCodeInput] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handlePay = async () => {
        // For now, if onPaymentSuccess is provided, we can use it for debug/bypass if needed, 
        // but normally we redirect. To fix linter, we'll just log or check it.
        if (onPaymentSuccess) console.log("Payment success callback available");

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            // Start Payment logic
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            // Use empty string for relative path in production, or deployed URL for local dev hitting prod
            const baseUrl = isLocal ? 'https://psychometric-app-d817b.web.app' : '';

            const response = await fetch(`${baseUrl}/api/createPayment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Guest User', // Ideally pass real name
                    email: 'user@example.com',
                    amount: '99' // Updated to match UI
                }),
            });

            const data = await response.json();

            if (data.success && data.longurl) {
                window.location.href = data.longurl;
            } else {
                console.error("Payment creation failed", data);
                setIsProcessing(false);
                setErrorMessage(data.error ? JSON.stringify(data.error) : "Payment creation failed. Please try again.");
            }

        } catch (error) {
            console.error("Payment Error", error);
            setIsProcessing(false);
            setErrorMessage(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            padding: '1rem'
        }}>
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '16px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💎</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
                    Unlock Your Future
                </h2>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                    Get a detailed 20-page career and personality analysis for just <strong>₹99</strong>. This small investment can change your entire career trajectory.
                </p>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#64748b' }}>Assessment Fee</span>
                        <span style={{ fontWeight: '600' }}>₹99.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold', color: '#1f2937' }}>Total Pay</span>
                        <span style={{ fontWeight: 'bold', color: '#4f46e5' }}>₹99.00</span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {errorMessage && (
                        <div style={{
                            color: '#b91c1c',
                            background: '#fef2f2',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            border: '1px solid #fecaca'
                        }}>
                            {errorMessage}
                        </div>
                    )}
                    <button
                        onClick={handlePay}
                        disabled={isProcessing}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            background: isProcessing ? '#94a3b8' : '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s'
                        }}
                    >
                        {isProcessing ? 'Processing (Please wait)...' : 'Pay ₹99 & Start'}
                    </button>

                    <div style={{ borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }}></div>

                    {/* Check for unlock code */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="Have an unlock code?"
                            value={unlockCodeInput}
                            onChange={(e) => setUnlockCodeInput(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                fontSize: '0.9rem'
                            }}
                        />
                        <button
                            onClick={() => {
                                if (unlockCodeInput === 'UNLOCK100') {
                                    if (onPaymentSuccess) onPaymentSuccess();
                                } else {
                                    setErrorMessage("Invalid Unlock Code");
                                }
                            }}
                            style={{
                                background: '#334155',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '0 1rem',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Apply
                        </button>
                    </div>

                    <button
                        onClick={onCancel}
                        disabled={isProcessing}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#6b7280',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
