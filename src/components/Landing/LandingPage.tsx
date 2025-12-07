import React from 'react';
import styles from './LandingPage.module.css';

interface LandingPageProps {
    onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <h1 className={styles.title}>Discover Your True Self</h1>
                <p className={styles.subtitle}>
                    A scientifically validated personality assessment based on the Five Factor Model.
                </p>
                <button className={styles.startButton} onClick={onStart}>
                    Begin Assessment
                </button>
            </div>

            <div className={styles.content}>
                <section className={styles.section}>
                    <h2>The Science Behind It</h2>
                    <p>
                        This assessment utilizes the <strong>IPIP-NEO-120</strong>, a highly respected inventory
                        measuring the "Big Five" personality traits. Unlike casual quizzes, this tool is derived
                        from decades of psychological research.
                    </p>
                </section>

                <section className={styles.grid}>
                    <div className={styles.card}>
                        <h3>Openness</h3>
                        <p>Creativity, curiosity, and willingness to try new things.</p>
                    </div>
                    <div className={styles.card}>
                        <h3>Conscientiousness</h3>
                        <p>Organization, dependability, and discipline.</p>
                    </div>
                    <div className={styles.card}>
                        <h3>Extraversion</h3>
                        <p>Social energy, assertiveness, and enthusiasm.</p>
                    </div>
                    <div className={styles.card}>
                        <h3>Agreeableness</h3>
                        <p>Compassion, cooperation, and trust in others.</p>
                    </div>
                    <div className={styles.card}>
                        <h3>Neuroticism</h3>
                        <p>Emotional sensitivity and reaction to stress.</p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>Career Mapping</h2>
                    <p>
                        Beyond personality, we analyze your traits to derive your <strong>Holland Code (RIASEC)</strong>,
                        providing data-driven career recommendations that align with your natural inclinations.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default LandingPage;
