import React, { useState, useEffect } from 'react';
import { useAssessment } from '../../context/AssessmentContext';
import styles from './Wizard.module.css';
import itemsData from '../../data/items.json';
import type { Item } from '../../types';


const BATCH_SIZE = 5;

import { translations } from '../../data/translations';

import UserDetailsForm from './UserDetailsForm';

const Wizard: React.FC = () => {
    const { currentStep, totalSteps, answers, setAnswer, nextStep, prevStep, finishAssessment, fillRandomAnswers, language, userDetails, setUserDetails, results, setCurrentCareer } = useAssessment();
    const t = translations[language].wizard;

    const [activeBatchIndex, setActiveBatchIndex] = useState(0);

    // Sync active batch
    useEffect(() => {
        setActiveBatchIndex(Math.floor(currentStep / BATCH_SIZE));
    }, [currentStep]);

    const handleDetailsSubmit = (details: { name: string; age: string; profession: string }) => {
        setUserDetails(details);
        setCurrentCareer(details.profession);
        // The form is shown if userDetails.name is empty. Setting it hides the form.
    };

    // Show form if name is not set AND we don't have results yet (to avoid loop if checking details logic)
    if (!userDetails.name && !results) {
        return <UserDetailsForm onSubmit={handleDetailsSubmit} initialData={userDetails} />;
    }

    const items = itemsData as Item[];
    const currentBatch = items.slice(activeBatchIndex * BATCH_SIZE, (activeBatchIndex + 1) * BATCH_SIZE);

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
                    </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    {t.tip}
                </p>
            </div>

            <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${progressPercentage}%` }}
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
                                className={`${styles.optionButton} ${answers[item.id] === val ? styles.selected : ''}`}
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
