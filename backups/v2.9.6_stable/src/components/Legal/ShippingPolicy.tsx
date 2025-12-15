import React from 'react';
import Footer from '../Shared/Footer';

const ShippingPolicy: React.FC = () => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#1e293b' }}>Shipping and Delivery Policy</h1>

                <div style={{ lineHeight: '1.6', color: '#475569' }}>
                    <p style={{ marginBottom: '1rem' }}><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#334155' }}>1. Digital Delivery Only</h2>
                    <p>CareerCompass provides digital services (Psychometric Reports). <strong>No physical goods are shipped.</strong></p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#334155' }}>2. Delivery Timeline</h2>
                    <p>Upon successful payment confirmation:</p>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li><strong>Instant Access:</strong> Your Premium Report is instantly unlocked on your results dashboard.</li>
                        <li><strong>Email Delivery:</strong> A PDF copy is sent to your registered email address within 5-10 minutes.</li>
                    </ul>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#334155' }}>3. Non-Delivery</h2>
                    <p>If you do not receive your report within 1 hour of payment:</p>
                    <ol style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li>Check your Spam/Junk folder.</li>
                        <li>Verify that your payment was successful.</li>
                        <li>Contact <a href="mailto:careercompass202525@gmail.com">careercompass202525@gmail.com</a> with your Transaction ID.</li>
                    </ol>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ShippingPolicy;
