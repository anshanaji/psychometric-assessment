import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Safety Timeout: Force loading=false if Auth takes too long (e.g. network issues)
        const safetyTimer = setTimeout(() => {
            setLoading(false);
        }, 3000);

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            clearTimeout(safetyTimer); // Clear timeout if auth responds
            try {
                setCurrentUser(user);
                // ... (rest of logic is inside try/catch) ...


                // Handle Referral Code in URL
                const urlParams = new URL(window.location.href).searchParams;
                const refCode = urlParams.get('ref');
                if (refCode) {
                    sessionStorage.setItem('referralCode', refCode);
                }

                if (user) {
                    // Create user document if it doesn't exist
                    const userRef = doc(db, 'users', user.uid);

                    try {
                        const userSnap = await getDoc(userRef);

                        if (!userSnap.exists()) {
                            let referredBy = null;
                            const savedRefCode = sessionStorage.getItem('referralCode');

                            // If referred, credit the referrer
                            if (savedRefCode) {
                                try {
                                    const referrerRef = doc(db, 'users', savedRefCode);
                                    const referrerSnap = await getDoc(referrerRef);

                                    if (referrerSnap.exists()) {
                                        await updateDoc(referrerRef, {
                                            walletBalance: increment(50)
                                        });
                                        referredBy = savedRefCode;
                                    }
                                } catch (e) {
                                    console.error("Error processing referral:", e);
                                }
                            }

                            // Create New User
                            await setDoc(userRef, {
                                email: user.email,
                                displayName: user.displayName,
                                createdAt: new Date().toISOString(),
                                walletBalance: 0,
                                referralCode: user.uid,
                                referredBy
                            });
                        }
                    } catch (firestoreError) {
                        console.error("Firestore access failed:", firestoreError);
                    }
                }
            } catch (error) {
                console.error("Auth State Check Failed:", error);
            } finally {
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error: any) {
            console.error("Error signing in with Google", error);
            // Temporary alert to help the user debug
            alert(`Login Failed: ${error.message}\nCheck your Firebase Console > Authentication > Settings > Authorized Domains.`);
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ currentUser, loading, signInWithGoogle, logout }}>
            {loading ? (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    flexDirection: 'column',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid #e2e8f0',
                        borderTopColor: '#3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading...</p>
                    <style>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
