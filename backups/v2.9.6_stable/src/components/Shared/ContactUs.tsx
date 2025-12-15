import React from 'react';
import Footer from '../Shared/Footer';

const ContactUs: React.FC = () => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#1e293b' }}>Contact Us</h1>

                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '1.2rem', color: '#475569', marginBottom: '2rem' }}>
                        Have questions or need assistance? We're here to help!
                    </p>

                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '0.5rem' }}>Email Support</h3>
                        <p style={{ fontSize: '1.25rem', color: '#4f46e5', fontWeight: 'bold' }}>
                            <a href="mailto:careercompass202525@gmail.com" style={{ textDecoration: 'none', color: 'inherit' }}>
                                careercompass202525@gmail.com
                            </a>
                        </p>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
                            We usually respond within 24 hours.
                        </p>
                    </div>


                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ContactUs;
