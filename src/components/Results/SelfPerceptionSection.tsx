import React from 'react';
import type { ConsistencyFlag } from '../../core/analysis';
import styles from './SelfPerceptionSection.module.css';

interface SelfPerceptionSectionProps {
    flags: ConsistencyFlag[];
}

export const SelfPerceptionSection: React.FC<SelfPerceptionSectionProps> = ({ flags }) => {
    // Determine Consistency Level
    const conflictCount = flags.length;
    let statusColor = 'green';
    let statusText = 'High Consistency';
    let statusDesc = 'You have a very clear, stable view of yourself.';

    if (conflictCount === 1) {
        statusColor = 'yellow';
        statusText = 'Moderate Consistency';
        statusDesc = 'You have a few complex areas where your behavior depends on the situation.';
    } else if (conflictCount >= 2) {
        statusColor = 'red';
        statusText = 'Complex Profile';
        statusDesc = 'Your profile shows significant internal conflict. You may be in a period of transition or high adaptability.';
    }

    // if (conflictCount === 0) return null; // Removed to show Success State
    // Show Green Card for 0 conflicts

    // Actually, if 0 conflicts, we should probably show the Green card to validate them! 
    // But for now, let's focus on showing conflicts if they exist, or a summary if not.

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>🧠 Self-Perception Analysis</h2>
                <p className={styles.subtitle}>
                    This section highlights areas where your self-view appears contradictory.
                    Exploring these tensions can reveal your deepest growth opportunities.
                </p>
            </div>

            {/* Traffic Light Indicator */}
            <div className={`${styles.trafficLight} ${styles[statusColor]}`}>
                <div className={styles.statusIcon}>
                    {statusColor === 'green' && '🟢'}
                    {statusColor === 'yellow' && '🟡'}
                    {statusColor === 'red' && '🔴'}
                </div>
                <div className={styles.statusContent}>
                    <h3>Consistency Score: <span className={styles.statusLabel}>{statusText}</span></h3>
                    <p>{statusDesc}</p>
                </div>
            </div>

            {/* Success Message for 0 Conflicts */}
            {conflictCount === 0 && (
                <div className={styles.cardGrid}>
                    <div className={styles.conflictCard} style={{ borderLeft: '4px solid #22c55e' }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTag} style={{ background: '#dcfce7', color: '#166534' }}>Verified</span>
                            <h4>Self-Perception Aligned</h4>
                        </div>
                        <div className={styles.cardBody}>
                            <p style={{ color: '#475569' }}>
                                Your answers are consistent across different contexts. This indicates high self-awareness and honesty in your responses.
                                The AI analysis below will be highly accurate.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Conflict Cards */}
            <div className={styles.cardGrid}>
                {flags.map((flag, index) => (
                    <div key={index} className={styles.conflictCard}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTag}>Conflict #{index + 1}</span>
                            <h4>{flag.title || 'Internal Tension'}</h4>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.conflictBox}>
                                <span className={styles.icon}>⚡</span>
                                <p>{flag.message}</p>
                            </div>
                            <div className={styles.insightBox}>
                                <strong>💡 Growth Update:</strong>
                                <p>Reflect on why these distinct sides of you exist. Can you integrate them?</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
