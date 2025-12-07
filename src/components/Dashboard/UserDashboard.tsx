import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import styles from './UserDashboard.module.css';

interface SavedReport {
    id: string;
    type: 'big5' | 'mbti';
    timestamp: any;
    resultSummary: any; // Simplified result
}

const UserDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const [reports, setReports] = useState<SavedReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            if (!currentUser) return;
            try {
                const q = query(
                    collection(db, `users/${currentUser.uid}/reports`),
                    orderBy('timestamp', 'desc')
                );
                const querySnapshot = await getDocs(q);
                const fetchedReports: SavedReport[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedReports.push({ id: doc.id, ...doc.data() } as SavedReport);
                });
                setReports(fetchedReports);
            } catch (error) {
                console.error("Error fetching reports:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [currentUser]);

    if (!currentUser) return <div>Please Log In</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>{currentUser.displayName}</h1>
                    <p>{currentUser.email}</p>
                </div>
                <button onClick={logout} className={styles.logoutBtn}>Sign Out</button>
            </header>

            <main className={styles.main}>
                <h2>Assessment History</h2>
                {loading ? (
                    <p>Loading records...</p>
                ) : reports.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No assessments found.</p>
                        <button onClick={() => window.location.href = '/'} className={styles.startBtn}>
                            Take New Assessment
                        </button>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {reports.map((report) => (
                            <div key={report.id} className={styles.reportCard}>
                                <div className={styles.cardHeader}>
                                    <span className={report.type === 'mbti' ? styles.tagMbti : styles.tagBig5}>
                                        {report.type.toUpperCase()}
                                    </span>
                                    <span className={styles.date}>
                                        {report.timestamp?.toDate().toLocaleDateString()}
                                    </span>
                                </div>
                                <div className={styles.cardBody}>
                                    {report.type === 'mbti' ? (
                                        <h3>Result: {report.resultSummary.type}</h3>
                                    ) : (
                                        <h3>Big Five Profile</h3>
                                    )}
                                    <button className={styles.viewBtn}>View Report (Coming Soon)</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default UserDashboard;
