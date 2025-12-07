import React from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './Login.module.css';

const Login: React.FC = () => {
    const { signInWithGoogle, currentUser } = useAuth();

    if (currentUser) {
        return (
            <div className={styles.container}>
                <h2>Welcome Back, {currentUser.displayName}!</h2>
                <p>You are already signed in.</p>
                <button className={styles.btn} onClick={() => window.location.href = '/dashboard'}>
                    Go to Dashboard
                </button>
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
