import React from 'react';
import Footer from '../Shared/Footer';

const Terms: React.FC = () => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Navbar is outside, but we need layout wrapper if Navbar is not global. 
                Assuming Navbar is global in App.tsx layout. 
            */}
            <div style={{ flex: 1, padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#1e293b' }}>Terms and Conditions</h1>

                <div style={{ lineHeight: '1.6', color: '#475569' }}>
                    <p style={{ marginBottom: '1rem' }}><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#334155' }}>1. Acceptance of Terms</h2>
                    <p>By accessing and using CareerCompass ("Platform"), you agree to comply with and be bound by these Terms and Conditions.</p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#334155' }}>2. Nature of Services</h2>
                    <p>CareerCompass provides psychometric assessments and career guidance based on standard psychological models (Big Five, RIASEC). These reports are for educational and self-awareness purposes only and do not constitute medical, psychological, or psychiatric advice.</p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#334155' }}>3. User Data & Privacy</h2>
                    <p>We take your privacy seriously. Your assessment data is generated locally or securely processed. We do not sell your personal data to third parties.</p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#334155' }}>4. Intellectual Property</h2>
                    <p>All content, algorithms, and designs on this Platform are the property of CareerCompass. You may not reproduce/distribute reports generated for others without authorization.</p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#334155' }}>5. Limitation of Liability</h2>
                    <p>CareerCompass is not liable for any career decisions made based on these reports. Career choices are complex and should involve multiple factors beyond this assessment.</p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#334155' }}>6. Contact</h2>
                    <p>For any legal queries, please contact <a href="mailto:careercompass202525@gmail.com">careercompass202525@gmail.com</a>.</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Terms;
