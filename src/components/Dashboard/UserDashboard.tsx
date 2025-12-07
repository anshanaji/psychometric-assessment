import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import styles from './UserDashboard.module.css';
import { useAssessment } from '../../context/AssessmentContext';
import { useNavigate } from 'react-router-dom';

interface SavedReport {
    id: string;
    type: 'big5' | 'mbti';
    timestamp: any;
    resultSummary: any;
    currentCareer?: string;
    results: any; // Full results for loading
}

const UserDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { setResults, setAssessmentType } = useAssessment();
    const navigate = useNavigate();

    const [reports, setReports] = useState<SavedReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [copyStatus, setCopyStatus] = useState('Copy Link');

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;
            try {
                // Fetch User Details (Wallet, RefCode)
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setUserData(userDocSnap.data());
                }

                // Fetch Reports
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
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    const copyToClipboard = () => {
        if (!userData?.referralCode) return;
        const link = `${window.location.origin}/login?ref=${userData.referralCode}`;
        navigator.clipboard.writeText(link);
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus('Copy Link'), 2000);
    };

    const loadReport = (report: SavedReport) => {
        // Load data into context
        setAssessmentType(report.type);
        setResults(report.results);

        // Navigate to result view (which is currently at root if results exist)
        navigate('/');
    };

    if (!currentUser) return <div>Please Log In</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div>
                            <h1>{currentUser.displayName}</h1>
                            <p>{currentUser.email}</p>
                        </div>
                        <nav>
                            <a href="/" style={{ color: '#4a5568', textDecoration: 'none', fontWeight: 'bold' }}>Home</a>
                        </nav>
                    </div>

                    {/* Wallet & Referral Widget */}
                    {userData && (
                        <div style={{
                            background: 'white',
                            padding: '1rem',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            gap: '2rem',
                            alignItems: 'center'
                        }}>
                            <div>
                                <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.25rem' }}>Wallet Balance</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#48bb78', margin: 0 }}>
                                    ₹{userData.walletBalance || 0}
                                </p>
                            </div>
                            <div style={{ paddingLeft: '2rem', borderLeft: '1px solid #e2e8f0' }}>
                                <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.25rem' }}>Refer & Earn ₹50</p>
                                <button
                                    onClick={copyToClipboard}
                                    style={{
                                        background: '#ebf8ff',
                                        color: '#3182ce',
                                        border: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {copyStatus}
                                </button>
                            </div>
                            <button onClick={logout} className={styles.logoutBtn} style={{ marginLeft: '1rem' }}>Sign Out</button>
                        </div>
                    )}
                    {!userData && <button onClick={logout} className={styles.logoutBtn}>Sign Out</button>}
                </div>
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
                                        <h3>Result: {report.resultSummary?.type || 'MBTI'}</h3>
                                    ) : (
                                        <h3>Big Five Profile</h3>
                                    )}
                                    {report.currentCareer && (
                                        <p style={{ margin: '0.5rem 0', color: '#2d3748', fontWeight: '500' }}>
                                            Role: <span style={{ color: '#4c51bf' }}>{report.currentCareer}</span>
                                        </p>
                                    )}
                                    <button
                                        className={styles.viewBtn}
                                        onClick={() => loadReport(report)}
                                    >
                                        View Report
                                    </button>
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
