import React from 'react';
import type { ConsistencyFlag } from '../../core/analysis';
import styles from './ConsistencyAlert.module.css';

interface ConsistencyAlertProps {
    flags: ConsistencyFlag[];
    onFix: () => void;
}

const ConsistencyAlert: React.FC<ConsistencyAlertProps> = ({ flags, onFix }) => {
    if (!flags || flags.length === 0) return null;

    return (
        <div className={styles.alertContainer}>
            <div className={styles.content}>
                <div className={styles.iconWrapper}>
                    <span className={styles.icon}>⚠️</span>
                </div>
                <div className={styles.text}>
                    <h3>Response Inconsistencies Detected</h3>
                    <p>
                        We found <strong>{flags.length} potential contradictions</strong> in your answers.
                        This might affect the accuracy of your profile.
                    </p>
                </div>
            </div>
            <button className={styles.fixButton} onClick={onFix}>
                Review & Fix Answers
            </button>
        </div>
    );
};

export default ConsistencyAlert;
