import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
            if (user) {
                // Create user document if it doesn't exist
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (!userSnap.exists()) {
                    await setDoc(userRef, {
                        email: user.email,
                        displayName: user.displayName,
                        createdAt: new Date().toISOString()
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
