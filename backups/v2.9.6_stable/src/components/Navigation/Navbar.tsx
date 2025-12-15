import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAssessment } from '../../context/AssessmentContext';

import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { language, setLanguage, resetAssessment } = useAssessment();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const handleLogoClick = (e: React.MouseEvent) => {
        if (window.location.pathname === '/') {
            e.preventDefault();
            resetAssessment();
            window.scrollTo(0, 0);
        } else {
            resetAssessment();
            window.scrollTo(0, 0);
        }
    };

    const isMal = language === 'ml';

    return (
        <nav className={styles.nav}>
            <div className={styles.leftSection}>
                <Link to="/" onClick={handleLogoClick} className={styles.logoLink}>
                    <div className={styles.logoIcon}></div>
                    <span className={styles.logoText}>CareerCompass</span>
                </Link>
                <div className={styles.navLinks}>
                    <Link to="/" className={styles.navLink}>Assessment</Link>
                    {currentUser && (
                        <Link to="/dashboard" className={styles.navLink}>Dashboard</Link>
                    )}
                </div>
            </div>

            <div className={styles.rightSection}>
                {/* Language Toggle */}
                <div className={styles.langToggle}>
                    <button
                        onClick={() => setLanguage('en')}
                        className={`${styles.toggleBtn} ${!isMal ? styles.activeToggle : ''}`}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLanguage('ml')}
                        className={`${styles.toggleBtn} ${isMal ? styles.activeToggle : ''}`}
                    >
                        ML
                    </button>
                </div>

                <div className={styles.divider}></div>

                <div className={styles.userSection}>
                    {currentUser ? (
                        <>
                            <span className={styles.userInfo}>
                                Hello, <strong>{currentUser.displayName || currentUser.email?.split('@')[0]}</strong>
                            </span>
                            <button
                                onClick={handleLogout}
                                className={styles.logoutBtn}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            className={styles.loginBtn}
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
