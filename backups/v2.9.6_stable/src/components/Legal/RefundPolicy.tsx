import React from 'react';
import Footer from '../Shared/Footer';

const RefundPolicy: React.FC = () => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#1e293b' }}>Refund and Cancellation Policy</h1>

                <div style={{ lineHeight: '1.6', color: '#475569' }}>
                    <p style={{ marginBottom: '1rem' }}><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#334155' }}>1. Digital Goods Policy</h2>
                    <p>Our "CareerCompass Premium Report" is a digital product. Once payment is confirmed and the report is generated/delivered (via screen or email), it is considered "consumed."</p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#334155' }}>2. No Refunds After Generation</h2>
                    <p>Due to the nature of digital goods, <strong>we do not offer refunds or cancellations once the assessment report has been generated</strong> or unlocked.</p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#334155' }}>3. Exceptions (Technical Errors)</h2>
                    <p>If you have paid but failed to receive your report due to a technical error on our side (e.g., server crash, payment gateway failure), we will:</p>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li>Manually generate and send your report to your registered email.</li>
                        <li>Or issue a full refund if we are unable to fulfill the service within 48 hours.</li>
                    </ul>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#334155' }}>4. Duplicate Payments</h2>
                    <p>If you were charged twice for the same transaction, the duplicate amount will be automatically refunded to your original payment method within 5-7 business days.</p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#334155' }}>5. Contact for Refunds</h2>
                    <p>For refund requests related to technical issues, please email <a href="mailto:careercompass202525@gmail.com">careercompass202525@gmail.com</a> with your Transaction ID.</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default RefundPolicy;
