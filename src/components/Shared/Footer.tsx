import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer style={{
            background: '#1e293b',
            color: '#94a3b8',
            padding: '4rem 2rem',
            textAlign: 'center',
            borderTop: '1px solid #334155'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'left' }}>

                {/* Brand */}
                <div>
                    <h3 style={{ color: 'white', marginBottom: '1rem' }}>CareerCompass</h3>
                    <p style={{ fontSize: '0.9rem' }}>
                        Scientifically validated career guidance for the modern world.
                    </p>
                </div>

                {/* Legal Links */}
                <div>
                    <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1rem' }}>Legal</h4>
                    <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li><Link to="/terms" style={{ color: '#94a3b8', textDecoration: 'none' }}>Terms & Conditions</Link></li>
                        <li><Link to="/refund-policy" style={{ color: '#94a3b8', textDecoration: 'none' }}>Refund & Cancellation</Link></li>
                        <li><Link to="/shipping-policy" style={{ color: '#94a3b8', textDecoration: 'none' }}>Shipping & Delivery</Link></li>
                    </ul>
                </div>

                {/* Contact */}
                <div>
                    <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1rem' }}>Contact</h4>
                    <p style={{ fontSize: '0.9rem' }}>
                        Email: <a href="mailto:careercompass202525@gmail.com" style={{ color: '#94a3b8', textDecoration: 'none' }}>careercompass202525@gmail.com</a><br />
                        Phone: +91 98765 43210
                    </p>
                    <p style={{ marginTop: '0.5rem' }}>
                        <Link to="/contact" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 'bold' }}>Visit Contact Page</Link>
                    </p>
                </div>

            </div>

            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #334155', fontSize: '0.85rem' }}>
                © {new Date().getFullYear()} CareerCompass. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
