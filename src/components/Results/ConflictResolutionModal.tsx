import React, { useState } from 'react';
import type { ConsistencyFlag } from '../../core/analysis';
import type { UserAnswers, Item } from '../../types';
import itemsData from '../../data/items.json';
import styles from './ConflictResolutionModal.module.css';

interface ConflictResolutionModalProps {
    flags: ConsistencyFlag[];
    currentAnswers: UserAnswers;
    onSave: (newAnswers: UserAnswers) => void;
    onClose: () => void;
}

const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({ flags, currentAnswers, onSave, onClose }) => {
    const [tempAnswers, setTempAnswers] = useState<UserAnswers>({ ...currentAnswers });

    // Helper to get item text
    const getItem = (id: string) => (itemsData as Item[]).find(i => i.id === id);

    const getLabel = (val: number) => {
        if (val === 1) return "Strongly Disagree";
        if (val === 2) return "Disagree";
        if (val === 3) return "Neutral";
        if (val === 4) return "Agree";
        if (val === 5) return "Strongly Agree";
        return "";
    };

    const handleChange = (id: string, val: number) => {
        setTempAnswers(prev => ({ ...prev, [id]: val }));
    };

    const handleSave = () => {
        onSave(tempAnswers);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Resolve Inconsistencies</h2>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={styles.body}>
                    <p className={styles.intro}>
                        Adjust your answers below to clarify your profile. Only the conflicting questions are shown.
                    </p>

                    {flags.map((flag, idx) => {
                        const itemA = getItem(flag.item1Id);
                        const itemB = getItem(flag.item2Id);

                        if (!itemA || !itemB) return null;

                        return (
                            <div key={idx} className={styles.conflictGroup}>
                                <div className={styles.flagHeader}>
                                    <span className={styles.flagTitle}>{flag.title || "Conflict"}</span>
                                    <p className={styles.flagMsg}>{flag.message}</p>
                                </div>

                                <div className={styles.inputs}>
                                    <div className={styles.inputRow}>
                                        <label>{itemA.text}</label>
                                        <input
                                            type="range" min="1" max="5"
                                            value={tempAnswers[itemA.id]}
                                            onChange={(e) => handleChange(itemA.id, parseInt(e.target.value))}
                                        />
                                        <span className={styles.valLabel}>{getLabel(tempAnswers[itemA.id])} ({tempAnswers[itemA.id]})</span>
                                    </div>
                                    <div className={styles.inputRow}>
                                        <label>{itemB.text}</label>
                                        <input
                                            type="range" min="1" max="5"
                                            value={tempAnswers[itemB.id]}
                                            onChange={(e) => handleChange(itemB.id, parseInt(e.target.value))}
                                        />
                                        <span className={styles.valLabel}>{getLabel(tempAnswers[itemB.id])} ({tempAnswers[itemB.id]})</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    <button className={styles.saveBtn} onClick={handleSave}>Recalculate Report</button>
                </div>
            </div>
        </div>
    );
};

export default ConflictResolutionModal;
