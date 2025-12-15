import React from 'react';
import styles from './ResultsDashboard.module.css';

interface CareerGridProps {
    careers: any[];
}

// Color scale for match scores
const getMatchColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Emerald 500
    if (score >= 60) return '#f59e0b'; // Amber 500
    if (score >= 40) return '#ef4444'; // Red 500
    return '#94a3b8'; // Slate 400
};

const CareerGrid: React.FC<CareerGridProps> = ({ careers }) => {

    return (
        <div className={styles.section}>
            {/* Header removed - controlled by parent */}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
                gap: '1rem'
            }}>
                {careers.map((career, idx) => {
                    const score = Math.round(career.matchScore);
                    const borderColor = getMatchColor(score);

                    return (
                        <div key={idx} className={styles.careerCard} style={{
                            borderColor: score >= 80 ? '#10b981' : '#e2e8f0',
                            backgroundColor: score >= 80 ? '#f0fdf4' : 'white'
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
                                    lineHeight: '1.4',
                                    marginBottom: '0.5rem'
                                }}>
                                    {career.title}
                                </h3>
                            </div>

                            <div style={{
                                marginTop: '1rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid rgba(0,0,0,0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Fit Score</span>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
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

            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '3rem', fontSize: '0.9rem', color: '#64748b', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
                    <span>Exceptional Fit (&gt;80%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></div>
                    <span>Good Fit (60-79%)</span>
                </div>
            </div>
        </div>
    );
};

export default CareerGrid;
