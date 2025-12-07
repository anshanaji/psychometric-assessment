import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';

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
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            // Handle Referral Code in URL
            const urlParams = new URL(window.location.href).searchParams;
            const refCode = urlParams.get('ref');
            if (refCode) {
                sessionStorage.setItem('referralCode', refCode);
            }

            if (user) {
                // Create user document if it doesn't exist
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    let referredBy = null;
                    const savedRefCode = sessionStorage.getItem('referralCode');

                    // If referred, credit the referrer
                    if (savedRefCode) {
                        try {
                            const referrerQuery = query(collection(db, 'users'), where('referralCode', '==', savedRefCode));
                            const referrerSnap = await getDocs(referrerQuery);

                            if (!referrerSnap.empty) {
                                const referrerDoc = referrerSnap.docs[0];
                                referredBy = referrerDoc.id;

                                // Credit ₹50 to referrer
                                await updateDoc(doc(db, 'users', referrerDoc.id), {
                                    walletBalance: increment(50)
                                });
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
                        referralCode: user.uid.slice(0, 8), // Simple unique code
                        referredBy
                    });
                }
            }
            setLoading(false);
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
            {!loading && children}
        </AuthContext.Provider>
    );
};
