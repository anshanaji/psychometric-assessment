import React from 'react';
import styles from './LandingPage.module.css';
import Footer from '../Shared/Footer';
import { useAssessment } from '../../context/AssessmentContext';
import { translations } from '../../data/translations';

import { useNavigate } from 'react-router-dom';

interface LandingPageProps { }

const LandingPage: React.FC<LandingPageProps> = () => {
    const { language, setAssessmentType, startAssessment } = useAssessment();
    const navigate = useNavigate();
    const isMal = language === 'ml';

    const handleStart = () => {
        setAssessmentType('big5');
        startAssessment();
        navigate('/test');
    };

    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <div className={styles.hero} style={{ paddingTop: '50px', background: 'radial-gradient(circle at 50% 50%, #f7fafc, #edf2f7)' }}>
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
                    {isMal ? 'ശാസ്ത്രീയ കരിയർ വിശകലനം' : 'Scientific Career Analysis'}
                </span>
                <h1 className={styles.title} style={{ fontSize: '3.5rem', lineHeight: '1.1', marginBottom: '1.5rem', color: '#1a202c' }}>
                    {isMal ? 'നിങ്ങൾക്കും നിങ്ങളുടെ ജോലിക്കും ഇടയിലുള്ള' : 'Align Who You Are with'} <br />
                    <span style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {isMal ? 'പൊരുത്തം കണ്ടെത്തൂ' : 'What You Do'}
                    </span>
                </h1>
                <p className={styles.subtitle} style={{ maxWidth: '600px', margin: '0 auto 2rem auto', color: '#4a5568', fontSize: '1.1rem' }}>
                    {isMal
                        ? 'നിങ്ങളുടെ വ്യക്തിത്വത്തിന് ഏറ്റവും അനുയോജ്യമായ കരിയർ തിരഞ്ഞെടുക്കൂ. സന്തുഷ്ടവും വിജയകരവുമായ ജീവിതം നയിക്കൂ.'
                        : 'Discover your true personality and find the career path that feels like home. Stop guessing, start thriving.'}
                </p>

                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <button
                        onClick={handleStart}
                        style={{
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '1rem 3rem',
                            fontSize: '1.2rem',
                            borderRadius: '50px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
                            transition: 'transform 0.2s'
                        }}
                    >
                        {isMal ? 'ടെസ്റ്റ് ആരംഭിക്കൂ (സൗജന്യം)' : 'Start Free Career Analysis'}
                    </button>
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#718096' }}>
                        ⏱️ Takes only 5-8 minutes • 🔒 Private & Secure
                    </p>
                </div>

                {/* Target Audience Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto 4rem auto' }}>

                    {/* Students */}
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderTop: '5px solid #3b82f6' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
                        <h3 style={{ fontSize: '1.5rem', color: '#1e293b', marginBottom: '1rem' }}>For Students</h3>
                        <p style={{ color: '#475569', lineHeight: '1.6' }}>
                            Confused about which stream or degree to choose? Don't follow the crowd. Find the path that matches your natural strengths.
                        </p>
                    </div>

                    {/* Executives */}
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderTop: '5px solid #10b981' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💼</div>
                        <h3 style={{ fontSize: '1.5rem', color: '#1e293b', marginBottom: '1rem' }}>For Professionals</h3>
                        <p style={{ color: '#475569', lineHeight: '1.6' }}>
                            Feeling stuck, burnt out, or unfulfilled? It might not be the job—it might be the fit. Rediscover your potential and pivot with confidence.
                        </p>
                    </div>

                </div>
            </div>

            <div className={styles.content}>

                {/* Science & Methodology Section */}
                <section className={styles.section} style={{ marginBottom: '6rem' }}>
                    <div className={styles.scienceBadge}>Recommended by Experts</div>
                    <h2 className={styles.scienceTitle}>{(translations as any)[language].science_section?.title || "Backed by Science, Built for You"}</h2>
                    <p className={styles.scienceSubtitle}>
                        {(translations as any)[language].science_section?.subtitle || "We use gold-standard psychometric models trusted by psychologists."}
                    </p>

                    <div className={styles.scienceGrid}>
                        {/* Big 5 */}
                        <div className={styles.scienceCard}>
                            <div className={styles.iconBox} style={{ background: '#e0e7ff', color: '#4338ca' }}>📊</div>
                            <h3>{(translations as any)[language].science_section?.cards?.big5?.title || "The Big Five Model"}</h3>
                            <p>{(translations as any)[language].science_section?.cards?.big5?.desc}</p>
                        </div>

                        {/* RIASEC */}
                        <div className={styles.scienceCard}>
                            <div className={styles.iconBox} style={{ background: '#dcfce7', color: '#15803d' }}>🧭</div>
                            <h3>{(translations as any)[language].science_section?.cards?.riasec?.title || "Holland Codes"}</h3>
                            <p>{(translations as any)[language].science_section?.cards?.riasec?.desc}</p>
                        </div>

                        {/* Jungian */}
                        <div className={styles.scienceCard}>
                            <div className={styles.iconBox} style={{ background: '#fef3c7', color: '#b45309' }}>🧩</div>
                            <h3>{(translations as any)[language].science_section?.cards?.jung?.title || "Jungian Archetypes"}</h3>
                            <p>{(translations as any)[language].science_section?.cards?.jung?.desc}</p>
                        </div>

                        {/* Reliability */}
                        <div className={styles.scienceCard}>
                            <div className={styles.iconBox} style={{ background: '#fee2e2', color: '#b91c1c' }}>🛡️</div>
                            <h3>{(translations as any)[language].science_section?.cards?.reliability?.title || "94% Reliability"}</h3>
                            <p>{(translations as any)[language].science_section?.cards?.reliability?.desc}</p>
                        </div>
                    </div>
                </section>

                {/* Why It Matters */}
                <section className={styles.section} style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2rem', color: '#111827', marginBottom: '1.5rem' }}>Why Career Fit Matters?</h2>
                    <p style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.1rem', color: '#4b5563', lineHeight: '1.8' }}>
                        "All personalities are good, but there must be a match between who we are and what we do."
                        <br /><br />
                        Working in a role that contradicts your nature leads to <strong>stress, burnout, and mediocrity</strong>.
                        When your career aligns with your personality, work feels like play, and success comes naturally.
                    </p>
                </section>

                {/* Testimonials */}
                <section className={styles.section} style={{ background: '#f8fafc', padding: '3rem 2rem', borderRadius: '20px' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Success Stories</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>

                        {/* Testimonial 1 */}
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <p style={{ fontStyle: 'italic', color: '#334155', marginBottom: '1.5rem' }}>
                                "I was pursuing Engineering just because my friends did. This test showed me my high 'Openness' and 'Aesthetics'. I switched to Architecture and I've never been happier."
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', background: '#cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Arjun Nair</h4>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Architecture Student, Kochi</span>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial 2 */}
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <p style={{ fontStyle: 'italic', color: '#334155', marginBottom: '1.5rem' }}>
                                "10 years in Banking and I was miserable. CareerCompass revealed my high 'Agreeableness' and need for social impact. I'm now in NGO Management and finally feel alive."
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', background: '#cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>P</div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Priya Menon</h4>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Ex-Banker, Bangalore</span>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial 3 */}
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <p style={{ fontStyle: 'italic', color: '#334155', marginBottom: '1.5rem' }}>
                                "The detail in this report is insane. It didn't just tell me 'Sales', it told me exactly WHY I'm good at it. A confidence booster!"
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', background: '#cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>R</div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Rahul K.</h4>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Sales Manager, Chennai</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

            </div>

            {/* Reusable Footer */}
            <div style={{ width: '100%', marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    );
};

export default LandingPage;
