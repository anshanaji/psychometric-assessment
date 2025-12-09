import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './Login.module.css';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const { signInWithGoogle, currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    if (currentUser) {
        return (
            <div className={styles.container}>
                <h2>Welcome Back, {currentUser.displayName}!</h2>
                <p>Redirecting...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Sign In</h1>
                <p className={styles.subtitle}>Access your assessment history and save new results.</p>

                <button className={styles.googleBtn} onClick={signInWithGoogle}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                    Sign in with Google
                </button>

                <p className={styles.footerText}>
                    By signing in, you agree to store your assessment results securely on our platform.
                </p>
            </div>
        </div>
    );
};

export default Login;
