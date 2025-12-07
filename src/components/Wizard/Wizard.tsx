import React, { useState, useEffect } from 'react';
import { useAssessment } from '../../context/AssessmentContext';
import styles from './Wizard.module.css';
import itemsData from '../../data/items.json';
import type { Item } from '../../types';
import allCareers from '../../data/all_careers.json';

const BATCH_SIZE = 5;

import { translations } from '../../data/translations';

const Wizard: React.FC = () => {
    const { currentStep, totalSteps, answers, setAnswer, nextStep, prevStep, finishAssessment, fillRandomAnswers, language } = useAssessment();
    const t = translations[language].wizard;

    const [activeBatchIndex, setActiveBatchIndex] = useState(0);
    const [careerInput, setCareerInput] = useState('');
    const [filteredCareers, setFilteredCareers] = useState<typeof allCareers>([]);
    const [showDropdown, setShowDropdown] = useState(false);

    // We need to manage local career state since we removed it from global context
    const [localCareer, setLocalCareer] = useState('');

    // Sync active batch
    useEffect(() => {
        setActiveBatchIndex(Math.floor(currentStep / BATCH_SIZE));
    }, [currentStep]);

    const handleCareerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCareerInput(value);
        if (value.length > 0) {
            const filtered = allCareers.filter(c =>
                c.title.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredCareers(filtered);
            setShowDropdown(true);
        } else {
            setShowDropdown(false);
        }
    };

    const selectCareer = (career: typeof allCareers[0]) => {
        setCareerInput(career.title);
        setLocalCareer(career.title);
        // Note: Career is computed in results now, but we can store it for display if needed. 
        // For now just local display.
        setShowDropdown(false);
    };

    const handleCareerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const match = allCareers.find(c => c.title.toLowerCase() === careerInput.toLowerCase());
        if (match) {
            setLocalCareer(match.title);
        } else {
            // Just accept it for display purposes if not perfect match, or strict?
            // Sticking to strict for now as per previous logic
            alert("Please select a career from the list.");
        }
    };

    if (!localCareer) {
        return (
            <div className={styles.wizardContainer}>
                <div className={styles.header}>
                    <h2>{t.welcome}</h2>
                    <p>{t.careerInputDesc}</p>
                </div>
                <div className={styles.questionCard} style={{ textAlign: 'center', padding: '3rem' }}>
                    <form onSubmit={handleCareerSubmit} style={{ maxWidth: '400px', margin: '0 auto', position: 'relative' }}>
                        <label htmlFor="career" style={{ display: 'block', marginBottom: '1rem', color: '#475569', fontWeight: 500 }}>
                            {t.jobTitleLabel}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                id="career"
                                value={careerInput}
                                onChange={handleCareerInputChange}
                                onFocus={() => careerInput && setShowDropdown(true)}
                                placeholder={t.searchPlaceholder}
                                autoComplete="off"
                                style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', marginBottom: '1.5rem' }}
                                required
                            />
                            {showDropdown && filteredCareers.length > 0 && (
                                <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: 0, margin: '-1rem 0 1rem', maxHeight: '200px', overflowY: 'auto', zIndex: 10, listStyle: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                    {filteredCareers.map((career, index) => (
                                        <li key={index} onClick={() => selectCareer(career)} style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', textAlign: 'left', color: '#334155' }}>
                                            {career.title}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            {t.startBtn}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const items = itemsData as Item[];
    const currentBatch = items.slice(activeBatchIndex * BATCH_SIZE, (activeBatchIndex + 1) * BATCH_SIZE);

    // We check against totalSteps. 
    // If activeBatchIndex * 5 is close to end.
    const isLastBatch = (activeBatchIndex + 1) * BATCH_SIZE >= totalSteps;

    const handleOptionSelect = (itemId: string, value: number) => {
        setAnswer(itemId, value);
    };

    const handleNext = () => {
        // Validate if all items in batch are answered
        const allAnswered = currentBatch.every(item => answers[item.id] !== undefined);
        if (!allAnswered) {
            alert("Please answer all questions in this section.");
            return;
        }

        if (isLastBatch) {
            finishAssessment();
        } else {
            for (let i = 0; i < BATCH_SIZE; i++) nextStep();
            setActiveBatchIndex(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const handlePrev = () => {
        if (activeBatchIndex > 0) {
            for (let i = 0; i < BATCH_SIZE; i++) prevStep();
            setActiveBatchIndex(prev => prev - 1);
            window.scrollTo(0, 0);
        }
    };

    const progressPercentage = Math.round(((activeBatchIndex * BATCH_SIZE) / totalSteps) * 100);

    const getLabel = (val: number) => {
        switch (val) {
            case 1: return t.strongly_disagree;
            case 2: return t.disagree;
            case 3: return t.neutral;
            case 4: return t.agree;
            case 5: return t.strongly_agree;
            default: return "";
        }
    };

    return (
        <div className={styles.wizardContainer}>
            <div className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2>{t.welcome}</h2>
                        <p>{t.careerInputDesc}</p>
                    </div>
                    {localCareer && (
                        <div style={{ textAlign: 'right', fontSize: '0.9rem', background: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                            <span style={{ display: 'block', color: '#64748b', fontSize: '0.8rem' }}>{t.assessingFor}</span>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{localCareer}</span>
                            <button
                                onClick={() => { setLocalCareer(''); }}
                                style={{ display: 'block', marginTop: '0.25rem', color: '#3b82f6', background: 'none', border: 'none', padding: 0, fontSize: '0.8rem', cursor: 'pointer', marginLeft: 'auto' }}
                            >
                                {t.changeRole}
                            </button>
                        </div>
                    )}
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    {t.tip}
                </p>
            </div>

            <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${progressPercentage}% ` }}
                    />
                </div>
                <div className={styles.progressText}>
                    <span>{t.section} {activeBatchIndex + 1} / {Math.ceil(totalSteps / BATCH_SIZE)}</span>
                    <span>{progressPercentage}% {t.complete}</span>
                </div>
            </div>

            {currentBatch.map((item) => (
                <div key={item.id} className={styles.questionCard}>
                    <h3 className={styles.questionText}>
                        {language === 'ml' && item.text_ml ? item.text_ml : item.text}
                    </h3>
                    <div className={styles.optionsGrid}>
                        {[1, 2, 3, 4, 5].map((val) => (
                            <button
                                key={val}
                                className={`${styles.optionButton} ${answers[item.id] === val ? styles.selected : ''} `}
                                onClick={() => handleOptionSelect(item.id, val)}
                            >
                                <span className={styles.optionValue}>{val}</span>
                                <span className={styles.optionLabel}>{getLabel(val)}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            <div className={styles.navigation}>
                <button
                    className="btn btn-secondary"
                    onClick={handlePrev}
                    disabled={activeBatchIndex === 0}
                >
                    {t.prev}
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleNext}
                >
                    {isLastBatch ? t.finish : t.nextSection}
                </button>
            </div>

            <button
                onClick={fillRandomAnswers}
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    right: '10px',
                    padding: '5px 10px',
                    background: '#333',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '10px',
                    opacity: 0.5,
                    cursor: 'pointer',
                    zIndex: 9999
                }}
                title="Developer Tool: Auto-fill answers and jump to end"
            >
                Dev: Fast Forward
            </button>
        </div>
    );
};

export default Wizard;
