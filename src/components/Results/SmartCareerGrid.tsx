import React from 'react';
import styles from './ResultsDashboard.module.css';

interface Career {
    title: string;
    code: string;
    matchScore: number;
}

interface SmartCareerGridProps {
    careers: Career[];
}

const getMatchColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Emerald 500
    if (score >= 60) return '#f59e0b'; // Amber 500
    if (score >= 40) return '#ef4444'; // Red 500
    return '#94a3b8'; // Slate 400
};

export const SmartCareerGrid: React.FC<SmartCareerGridProps> = ({ careers }) => {
    if (!careers || careers.length === 0) return null;

    return (
        <div className={styles.section}>
            {/* NO HEADERS HERE - PURE GRID */}

            <div className={styles.responsiveGrid}>
                {careers.map((career, idx) => {
                    const score = Math.round(career.matchScore);
                    const borderColor = getMatchColor(score);

                    return (
                        <div key={idx} className={styles.careerCard} style={{
                            borderColor: score >= 80 ? '#10b981' : '#e2e8f0',
                            backgroundColor: score >= 80 ? '#f0fdf4' : 'white',
                            transition: 'transform 0.2s',
                            cursor: 'default'
                        }}>
                            <div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    color: '#64748b',
                                    marginBottom: '0.5rem'
                                }}>
                                    {career.code}
                                </div>
                                <h3 style={{
                                    fontWeight: 700,
                                    color: '#1e293b',
                                    fontSize: '1rem',
                                    lineHeight: '1.3',
                                    marginBottom: '0.5rem',
                                    minHeight: '2.6em' // Homogenize height
                                }}>
                                    {career.title}
                                </h3>
                            </div>

                            <div style={{
                                marginTop: '1rem',
                                paddingTop: '0.75rem',
                                borderTop: '1px solid rgba(0,0,0,0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Fit</span>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontWeight: 800,
                                    color: borderColor,
                                    fontSize: '1.1rem'
                                }}>
                                    {score}%
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
                Showing top {careers.length} matches based on your profile compatibility.
            </div>
        </div>
    );
};
