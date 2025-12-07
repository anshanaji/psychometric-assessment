import React from 'react';
import styles from './LandingPage.module.css';

interface LandingPageProps {
    onStart: () => void;
}

import { useAssessment } from '../../context/AssessmentContext';
import { translations } from '../../data/translations';

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    const { language, setLanguage, setAssessmentType } = useAssessment();
    const t = translations[language];

    const isMal = language === 'ml';

    return (
        <div className={styles.container}>
            <header style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '1.5rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10,
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '8px' }}></div>
                    <span style={{ fontWeight: '800', fontSize: '1.2rem', color: '#2d3748', letterSpacing: '-0.5px' }}>
                        NeuroMetric <span style={{ color: '#764ba2' }}>Intelligence</span>
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setLanguage('en')} className={!isMal ? styles.activeLang : styles.inactiveLang}>EN</button>
                    <button onClick={() => setLanguage('ml')} className={isMal ? styles.activeLang : styles.inactiveLang}>ML</button>
                </div>
            </header>

            <div className={styles.hero} style={{ paddingTop: '100px', background: 'radial-gradient(circle at 50% 50%, #f7fafc, #edf2f7)' }}>
                <span style={{
                    background: '#e0e7ff',
                    color: '#4338ca',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    display: 'inline-block'
                }}>
                    {isMal ? 'ശാസ്ത്രീയ വ്യക്തിത്വ വിശകലനം' : 'Scientific Personality Analysis'}
                </span>
                <h1 className={styles.title} style={{ fontSize: '3.5rem', lineHeight: '1.1', marginBottom: '1.5rem', color: '#1a202c' }}>
                    {isMal ? 'നിങ്ങളുടെ യഥാർത്ഥ വ്യക്തിത്വം കണ്ടെത്തൂ' : 'Discover Your True'} <br />
                    <span style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {isMal ? 'ശാസ്ത്രീയമായ വഴികളിലൂടെ' : 'Cognitive Architecture'}
                    </span>
                </h1>
                <p className={styles.subtitle} style={{ maxWidth: '600px', margin: '0 auto 3rem auto', color: '#4a5568' }}>
                    {isMal
                        ? 'ബിഗ് ഫൈവ്, എംബിടിഐ തുടങ്ങിയ ലോകോത്തര നിലവാരമുള്ള ടെസ്റ്റുകളിലൂടെ നിങ്ങളുടെ കരിയറും ഭാവിയും മെച്ചപ്പെടുത്തൂ.'
                        : 'Unlock deep insights into your personality, work style, and ideal career paths using industry-standard psychometric assessments.'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>

                    {/* Big Five Card */}
                    <div className={styles.testCard} onClick={() => { setAssessmentType('big5'); onStart(); }}>
                        <div className={styles.cardHeader} style={{ background: '#ebf4ff' }}>
                            <span className={styles.badge} style={{ color: '#2b6cb0', background: '#bee3f8' }}>Scientific Gold Standard</span>
                            <div style={{ fontSize: '3rem', marginTop: '1rem' }}>🧬</div>
                        </div>
                        <div className={styles.cardBody}>
                            <h3>Big Five (IPIP-NEO)</h3>
                            <p>{isMal ? 'ഏറ്റവും കൃത്യതയാർന്ന ശാസ്ത്രീയ വിശകലനം.' : 'The most scientifically validated personality model. Measures 5 major traits and 30 facets.'}</p>
                            <button className={styles.cardBtn}>Start Big Five &rarr;</button>
                        </div>
                    </div>

                    {/* MBTI Card */}
                    <div className={styles.testCard} onClick={() => { setAssessmentType('mbti'); onStart(); }}>
                        <div className={styles.cardHeader} style={{ background: '#f3e8ff' }}>
                            <span className={styles.badge} style={{ color: '#6b46c1', background: '#e9d8fd' }}>Popular & Cognitive</span>
                            <div style={{ fontSize: '3rem', marginTop: '1rem' }}>🧩</div>
                        </div>
                        <div className={styles.cardBody}>
                            <h3>MBTI Assessment</h3>
                            <p>{isMal ? 'ജോലി ശൈലിയും ചിന്താരീതിയും മനസിലാക്കാൻ.' : 'Understand your cognitive preferences, energy flow, and decision-making style (16 Types).'}</p>
                            <button className={styles.cardBtn}>Start MBTI &rarr;</button>
                        </div>
                    </div>

                </div>
            </div>


            <div className={styles.content}>
                <section className={styles.section}>
                    <h2>{t.science_title}</h2>
                    <p>
                        {t.science_desc}
                    </p>
                </section>

                <section className={styles.grid}>
                    <div className={styles.card} style={{ borderTop: '4px solid #48bb78' }}>
                        <h3>{t.cards.science.title}</h3>
                        <p>{t.cards.science.desc}</p>
                    </div>
                    <div className={styles.card} style={{ borderTop: '4px solid #4299e1' }}>
                        <h3>{t.cards.career.title}</h3>
                        <p>{t.cards.career.desc}</p>
                    </div>
                    <div className={styles.card} style={{ borderTop: '4px solid #ed8936' }}>
                        <h3>{t.cards.growth.title}</h3>
                        <p>{t.cards.growth.desc}</p>
                    </div>
                    <div className={styles.card} style={{ borderTop: '4px solid #9f7aea' }}>
                        <h3>{t.cards.cognition.title}</h3>
                        <p>{t.cards.cognition.desc}</p>
                    </div>
                </section>

                <section className={styles.section} style={{ background: '#ebf8ff', padding: '2rem', borderRadius: '12px', marginTop: '2rem' }}>
                    <h2 style={{ color: '#2b6cb0' }}>{t.why_alignment.title}</h2>
                    <p style={{ fontSize: '1.1rem', color: '#2c5282' }}>
                        {t.why_alignment.desc}
                    </p>
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
