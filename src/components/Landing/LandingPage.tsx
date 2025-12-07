import React from 'react';
import styles from './LandingPage.module.css';

interface LandingPageProps {
    onStart: () => void;
}

import { useAssessment } from '../../context/AssessmentContext';
import { translations } from '../../data/translations';

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    const { language, setLanguage } = useAssessment();
    const t = translations[language];

    return (
        <div className={styles.container}>
            <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px' }}>
                <button
                    onClick={() => setLanguage('en')}
                    style={{
                        opacity: language === 'en' ? 1 : 0.5,
                        fontWeight: language === 'en' ? 'bold' : 'normal',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        background: language === 'en' ? '#fff' : 'rgba(255,255,255,0.2)',
                        color: '#333',
                        cursor: 'pointer'
                    }}
                >
                    English
                </button>
                <button
                    onClick={() => setLanguage('ml')}
                    style={{
                        opacity: language === 'ml' ? 1 : 0.5,
                        fontWeight: language === 'ml' ? 'bold' : 'normal',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        background: language === 'ml' ? '#fff' : 'rgba(255,255,255,0.2)',
                        color: '#333',
                        cursor: 'pointer'
                    }}
                >
                    മലയാളം
                </button>
            </div>

            <div className={styles.hero}>
                <h1 className={styles.title}>{t.title}</h1>
                <p className={styles.subtitle}>
                    {t.subtitle}
                </p>
                <button className={styles.startButton} onClick={onStart}>
                    {t.start}
                </button>
            </div>

            <div className={styles.content}>
                <section className={styles.section}>
                    <h2>{t.science_title}</h2>
                    <p>
                        {t.science_desc}
                    </p>
                </section>

                <section className={styles.grid}>
                    <div className={styles.card}>
                        <h3>{t.cards.O.title}</h3>
                        <p>{t.cards.O.desc}</p>
                    </div>
                    <div className={styles.card}>
                        <h3>{t.cards.C.title}</h3>
                        <p>{t.cards.C.desc}</p>
                    </div>
                    <div className={styles.card}>
                        <h3>{t.cards.E.title}</h3>
                        <p>{t.cards.E.desc}</p>
                    </div>
                    <div className={styles.card}>
                        <h3>{t.cards.A.title}</h3>
                        <p>{t.cards.A.desc}</p>
                    </div>
                    <div className={styles.card}>
                        <h3>{t.cards.N.title}</h3>
                        <p>{t.cards.N.desc}</p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>{t.career_title}</h2>
                    <p>
                        {t.career_desc}
                    </p>
                </section>
            </div>
        </div>
    );
};

export default LandingPage;
