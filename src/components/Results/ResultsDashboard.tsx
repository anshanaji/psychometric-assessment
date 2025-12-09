import React, { useRef, useState, useEffect } from 'react';
import { useAssessment } from '../../context/AssessmentContext';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import html2canvas from 'html2canvas';
import { pdf } from '@react-pdf/renderer';
import PaymentModal from '../Payment/PaymentModal';


import Chart from 'chart.js/auto';

import allCareers from '../../data/all_careers.json';
import facetsText from '../../data/facets_text.json';
import styles from './ResultsDashboard.module.css';
import PDFDocument from '../Report/PDFReport'; // Renamed import to avoid visual confusion, though file is PDFReport.tsx
import { HiddenCharts } from '../Report/HiddenCharts';
import bigFiveInsights from '../../data/big_five_insights.json';
import itemsData from '../../data/items.json';
import { getLevel } from '../../core/scoring';
import { translations } from '../../data/translations';
import type { Domain } from '../../types';

import { db } from '../../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { generateAIAnalysis } from '../../services/gemini';
import ReactMarkdown from 'react-markdown';
import { deriveMotivationDrivers, deriveExcellenceProfile, identifySynergies, deriveLearningStyle, evaluateBroadCareerCategories } from '../../core/advancedInsights';

const ResultsDashboard: React.FC = () => {
    const { results, resetAssessment, currentCareer, isGenerating, language, userDetails, setResults, hasPaid, setHasPaid } = useAssessment();
    const { currentUser } = useAuth(); // Add auth context
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
    const [showPayment, setShowPayment] = useState(false);

    // AI State
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const t = translations[language].results;

    const hiddenChartsRef = useRef<HTMLDivElement>(null);
    const [isPreparingPdf, setIsPreparingPdf] = useState(false);

    // Advanced Insights
    const drivers = results?.domains ? deriveMotivationDrivers(results.domains, language) : [];
    const synergies = results?.domains ? identifySynergies(results.domains, language) : [];
    const hero = results?.domains ? deriveExcellenceProfile(results.domains) : null;
    const learningStyle = results?.domains ? deriveLearningStyle(results.domains, language) : null;
    const broadCategories = results ? evaluateBroadCareerCategories(results, language) : [];

    // Chart.js Radar Chart
    const chartRef = useRef<HTMLCanvasElement>(null);

    // Effect for Radar Chart using Chart.js (as in previous implementation)
    // We kept Recharts import but previous code used Chart.js for the Radar in one view.
    // Let's stick to Recharts for uniformity if possible, OR restore Chart.js logic.
    // The previous code had both! It used Recharts for Bar/Radar in one view and Chart.js in another?
    // Actually, looking at the previous file content, it had `new Chart(ctx, ...)` in a useEffect.
    // I will restore that logic as it seems to be the "Profile Shape" chart in the 'overview' tab.

    useEffect(() => {
        if (!results || !chartRef.current) return;

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        const existingChart = Chart.getChart(chartRef.current);
        if (existingChart) existingChart.destroy();

        const labels = results.domains ? Object.keys(results.domains).map(d => {
            const domain = d as Domain;
            // @ts-ignore
            return language === 'ml' ? bigFiveInsights[domain].name_ml : bigFiveInsights[domain].name;
        }) : [];

        const data = results.domains ? Object.values(results.domains).map(r => r.percentile) : [];

        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: language === 'ml' ? 'നിങ്ങളുടെ സ്കോർ' : 'Your Score',
                    data: data,
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(99, 102, 241, 1)'
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: { color: 'rgba(0,0,0,0.1)' },
                        grid: { color: 'rgba(0,0,0,0.1)' },
                        suggestedMin: 0,
                        suggestedMax: 100,
                        ticks: { backdropColor: 'transparent' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }, [results, language]);


    if (isGenerating) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <h2>{t.calculating}</h2>
            </div>
        );
    }

    if (!results) return null;

    // const domainColors = {
    //     O: '#4361ee',
    //     C: '#3f37c9',
    //     E: '#4895ef',
    //     A: '#4cc9f0',
    //     N: '#7209b7',
    //     H: '#f72585',
    //     C: '#3a0ca3'
    // };

    // const domainData = results.domains ? Object.entries(results.domains).map(([key, value]) => ({
    //     name: language === 'ml' ? (bigFiveInsights as any)[key].name_ml : (bigFiveInsights as any)[key].name,
    //     key: key,
    //     score: value.percentile,
    //     fullMark: 100,
    //     fill: (domainColors as any)[key]
    // })) : [];



    // const primaryCode = results.topRiasec ? results.topRiasec.charAt(0) as keyof typeof careerIntelligence : 'R';


    // Auto-generate AI analysis on mount if not present
    useEffect(() => {
        const autoGenerate = async () => {
            if (results && !results.aiAnalysis && !aiAnalysis && !isAnalyzing && !analysisError) {

                setIsAnalyzing(true);
                try {
                    console.log("Auto-generating AI Analysis...");
                    const analysis = await generateAIAnalysis({
                        scores: results.domains,
                        type: results.mbti?.type,
                        career: currentCareer
                    }, userDetails, language);

                    setAiAnalysis(analysis);

                    const updatedResults = { ...results, aiAnalysis: analysis };

                    if (setResults) {
                        setResults(updatedResults);
                    }

                } catch (err: any) {
                    console.error("Auto-generation failed", err);
                    setAnalysisError(err.message || "Could not generate analysis.");
                } finally {
                    setIsAnalyzing(false);
                }
            } else if (results && results.aiAnalysis) {
                // If already in results (e.g. loaded from DB), use it
                setAiAnalysis(results.aiAnalysis);
            }
        };

        autoGenerate();
    }, [results, userDetails, language]);

    const saveResult = async () => {
        if (!currentUser || !results) return;
        setIsSaving(true);
        try {
            const reportId = `${results.assessmentType}_${Date.now()}`;
            const reportRef = doc(db, `users/${currentUser.uid}/reports`, reportId);

            const resultSummary = results.assessmentType === 'mbti'
                ? { type: results.mbti?.type, name: results.mbti?.details.name, career: currentCareer }
                : { riasec: results.topRiasec, career: currentCareer };

            await setDoc(reportRef, {
                type: results.assessmentType,
                timestamp: serverTimestamp(),
                results: results,
                currentCareer: currentCareer,
                resultSummary
            });
            setSaveStatus('saved');
        } catch (error) {
            console.error("Error saving result:", error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadReport = async () => {
        setIsPreparingPdf(true);
        try {
            let imgData = null;
            // 1. Generate Chart Image
            if (hiddenChartsRef.current) {
                try {
                    // Wait a brief moment to ensure rendering
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const canvas = await html2canvas(hiddenChartsRef.current, {
                        scale: 2,
                        logging: false,
                        useCORS: true
                    });
                    imgData = canvas.toDataURL('image/png');
                } catch (imgErr) {
                    console.warn("Chart image generation failed, proceeding without chart.", imgErr);
                }
            }

            // 2. Generate PDF Blob
            const blob = await pdf(
                <PDFDocument
                    results={results}
                    chartImage={imgData}
                    language={language}
                    rolesToAvoid={rolesToAvoid}
                    allCareers={sortedCareers}
                    userName={userDetails?.name}
                />
            ).toBlob();

            // 3. Trigger Download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `personality_report_${language}_${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("PDF Generation failed:", error);
            alert(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsPreparingPdf(false);
        }
    };


    const calculateMatchScore = (userCode: string, careerCode: string, careerTitle: string): number => {
        if (!userCode || !careerCode) return 20;

        const userPrimary = userCode.charAt(0);
        const userSecondary = userCode.charAt(1);
        const userTertiary = userCode.charAt(2);

        const careerPrimary = careerCode.charAt(0);
        const careerSecondary = careerCode.charAt(1) || '';
        const careerTertiary = careerCode.charAt(2) || '';

        let score = 10; // Start low to allow for 10%

        // Primary Code Logic (Weight: High)
        if (careerPrimary === userPrimary) score += 45;
        else if (careerPrimary === userSecondary) score += 30;
        else if (careerPrimary === userTertiary) score += 15;

        // Secondary Code Logic (Weight: Medium)
        if (careerSecondary === userSecondary) score += 25;
        else if (careerSecondary === userPrimary) score += 20;
        else if (careerSecondary === userTertiary) score += 10;

        // Tertiary Code Logic (Weight: Low)
        if (careerTertiary === userTertiary) score += 15;
        else if (careerTertiary === userPrimary) score += 10;
        else if (careerTertiary === userSecondary) score += 10;

        const isExecutive = /Chief|Executive|Manager|Director|Lead|Head|Owner|Founder/i.test(careerTitle);

        if (isExecutive && results.domains && results.facets) {
            const cPercentile = results.domains.C.percentile;
            const nAnger = results.facets['N2']?.percentile || 50;
            const cIndustriousness = results.facets['C4']?.percentile || 50;

            if (cPercentile < 40) score -= 20;
            if (cIndustriousness < 30) score -= 15;
            if (nAnger > 70) score -= 15;
        }

        return Math.min(99, Math.max(10, score));
    };

    const safeAllCareers = Array.isArray(allCareers) ? allCareers : [];

    const calculatedScoredCareers = safeAllCareers.map(career => ({
        ...career,
        matchScore: calculateMatchScore(results.topRiasec || '', career.code, career.title)
    }));

    const sortedCareers = [...calculatedScoredCareers].sort((a, b) => b.matchScore - a.matchScore);

    // const topMatches = sortedCareers.slice(0, 10); // Removed as we show all now

    const rolesToAvoid = [...sortedCareers]
        .reverse() // Lowest matches
        .slice(0, 5) // Top 5 lowest
        .map(c => ({ ...c, burnoutRisk: 100 - c.matchScore }));


    let currentCareerFit = 0;
    try {
        if (currentCareer) {
            // Try to find exact match first if we don't have code
            const match = safeAllCareers.find(c => c.title.toLowerCase() === currentCareer.toLowerCase());
            if (match) {
                currentCareerFit = calculateMatchScore(results.topRiasec || '', match.code, match.title);
            } else {
                currentCareerFit = 50; // Default if not found
            }
        }
    } catch (e) {
        console.error("Error calculating career fit", e);
        currentCareerFit = 50;
    }

    // Unified Render Logic
    const isMbti = results.assessmentType === 'mbti' && results.mbti;
    const isBig5 = results.assessmentType === 'big5';

    // Fallback if neither (should ideally not happen with valid data)
    if (!isMbti && !isBig5) {
        return (
            <div className={styles.dashboardContainer} style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div className={styles.card} style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Assessment Data Error</h2>
                    <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                        Unknown assessment type: {results.assessmentType}.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={resetAssessment}
                        style={{
                            padding: '0.75rem 2rem',
                            fontSize: '1rem',
                            background: '#ef4444',
                            border: 'none',
                            color: 'white',
                            borderRadius: '0.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        Reset & Retake
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboardContainer}>
            <HiddenCharts ref={hiddenChartsRef} results={results} />

            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>
                        {t.hero_title}
                    </h1>
                    {userDetails?.name && (
                        <p className={styles.subtitle}>Prepared for <strong style={{ color: '#0f172a' }}>{userDetails.name}</strong> • {userDetails.profession || 'Professional'}</p>
                    )}
                </div>

                <div className={styles.btnGroup}>
                    {currentUser ? (
                        <button
                            className="btn btn-secondary"
                            onClick={saveResult}
                            disabled={isSaving || saveStatus === 'saved'}
                        >
                            {isSaving ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : 'Save Result'}
                        </button>
                    ) : (
                        <button
                            className="btn btn-secondary"
                            onClick={() => window.location.href = '/login'}
                        >
                            Login to Save
                        </button>
                    )}

                    <button
                        className="btn btn-primary"
                        onClick={handleDownloadReport}
                        disabled={isPreparingPdf}
                        style={{ minWidth: '160px' }}
                    >
                        {isPreparingPdf ? (
                            <>Generating...</>
                        ) : (
                            <>
                                <span style={{ marginRight: '8px' }}>⬇</span>
                                {t.download_pdf || 'Download Report'}
                            </>
                        )}
                    </button>
                </div>
            </header>

            {currentCareer && (
                <div className={styles.section}>
                    <div className={styles.card} style={{ borderLeft: `6px solid ${currentCareerFit > 70 ? '#22c55e' : '#eab308'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                            <div>
                                <p className={styles.textMuted} style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                                    {t.assessing_for || "Role Fit Analysis"}
                                </p>
                                <h3 className={styles.title} style={{ fontSize: '2rem', margin: 0 }}>{currentCareer}</h3>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 800, color: currentCareerFit > 70 ? '#16a34a' : '#ca8a04', lineHeight: 1 }}>
                                    {currentCareerFit}%
                                </div>
                                <span className={styles.textMuted}>{t.fit_score_label || "Match Score"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.section}>
                {isMbti && results.mbti ? (
                    <div className={styles.heroCard}>
                        <div className={styles.codeCircle} style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 10px 20px rgba(124, 58, 237, 0.3)' }}>
                            <span className={styles.codeValue} style={{ fontSize: '2.5rem' }}>{results.mbti.type}</span>
                        </div>
                        <div className={styles.heroContent}>
                            <h2 className={styles.title} style={{ marginBottom: '0.5rem' }}>{results.mbti.details.name}</h2>
                            <p className={styles.textMuted} style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                                {results.mbti.details.description}
                            </p>
                        </div>
                    </div>
                ) : (
                    // Big5 Hero
                    <div className={styles.heroCard}>
                        <div className={styles.codeCircle} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)' }}>
                            <span className={styles.codeValue} style={{ fontSize: '2.5rem' }}>{results.topRiasec}</span>
                        </div>
                        <div className={styles.heroContent}>
                            <h2 className={styles.title} style={{ marginBottom: '0.5rem' }}>Career Personality Profile</h2>
                            <p className={styles.textMuted} style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                                Based on the Five Factor Model your profile indicates a strong alignment with <strong>{results.topRiasec}</strong> traits.
                                See the detailed breakdown below for more insights.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {showPayment && (
                <PaymentModal
                    onPaymentSuccess={() => {
                        setHasPaid(true);
                        setShowPayment(false);
                    }}
                    onCancel={() => setShowPayment(false)}
                />
            )}

            <div style={{ position: 'relative' }}>
                {!hasPaid && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        zIndex: 10,
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 15%, rgba(255,255,255,1) 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        paddingTop: '150px'
                    }}>
                        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center', maxWidth: '500px', width: '90%', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: '#1e293b' }}>Unlock Your Full Report</h3>
                            <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.6' }}>
                                You've scratched the surface! Get immediate access to:
                                <ul style={{ textAlign: 'left', margin: '1rem auto', display: 'inline-block', color: '#475569' }}>
                                    <li>✨ Detailed Personality Breakdown</li>
                                    <li>🚀 Top Career Matches & Compatibility</li>
                                    <li>💡 Personalized Growth Areas</li>
                                    <li>🤖 AI-Powered Career Coach Analysis</li>
                                </ul>
                            </p>
                            <button onClick={() => setShowPayment(true)} className="btn btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '1rem', fontWeight: 700 }}>
                                Unlock Now • ₹100
                            </button>
                            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>One-time payment for lifetime access</p>
                        </div>
                    </div>
                )}

                <div style={{ filter: !hasPaid ? 'blur(8px)' : 'none', opacity: !hasPaid ? 0.4 : 1, pointerEvents: !hasPaid ? 'none' : 'auto', userSelect: !hasPaid ? 'none' : 'auto', transition: 'all 0.5s ease' }}>
                    {isMbti && results.mbti && (
                        <div className={styles.grid}>
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.cardTitle} style={{ color: '#166534' }}>
                                        {language === 'ml' ? 'കഴിവുകൾ' : 'Key Strengths'}
                                    </h3>
                                </div>
                                <ul className={styles.list} style={{ paddingLeft: 0, listStyle: 'none' }}>
                                    {(results.mbti.details.strengths || []).map((s: string, i: number) => (
                                        <li key={i} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9', color: '#334155', display: 'flex', gap: '0.5rem' }}>
                                            <span className={styles.textSuccess}>✓</span> {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.cardTitle} style={{ color: '#b45309' }}>
                                        {language === 'ml' ? 'ദൗർബല്യങ്ങൾ' : 'Growth Areas'}
                                    </h3>
                                </div>
                                <ul className={styles.list} style={{ paddingLeft: 0, listStyle: 'none' }}>
                                    {(results.mbti.details.weaknesses || []).map((w: string, i: number) => (
                                        <li key={i} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9', color: '#334155', display: 'flex', gap: '0.5rem' }}>
                                            <span className={styles.textWarning}>!</span> {w}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {isMbti && results.mbti?.details.work_style && (
                        <div className={styles.section} style={{ marginTop: '3rem' }}>
                            <div className={styles.aiSection} style={{ borderLeftColor: '#0ea5e9', background: '#f0f9ff' }}>
                                <h3 className={styles.sectionTitle}>{language === 'ml' ? 'ജോലി ശൈലി' : 'Work Style'}</h3>
                                <p style={{ fontSize: '1.1rem', color: '#334155', lineHeight: '1.6' }}>
                                    {results.mbti.details.work_style}
                                </p>
                            </div>
                        </div>
                    )}

                    {results.consistencyFlags && results.consistencyFlags.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.alert}>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    ⚠️ {t.consistency_title}
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
                                    {t.consistency_desc}
                                </p>
                                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {results.consistencyFlags.map((flag, idx) => (
                                        <div key={idx} style={{ background: 'rgba(255,255,255,0.5)', padding: '0.5rem', borderRadius: '4px' }}>
                                            <strong>{t.potential_contradiction}:</strong> {flag.message}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>{t.profile_domains}</h2>
                        <div className={styles.grid}>
                            {/* Only show Radar for Big5 or if desired for all? It uses results.domains which Mbti might not have */}
                            {results.domains && (
                                <div className={styles.chartCard} style={{ gridColumn: isBig5 ? 'span 2' : 'span 1' }}>
                                    <h3>{t.profile_shape}</h3>
                                    <canvas ref={chartRef} style={{ maxHeight: '350px' }}></canvas>
                                </div>
                            )}


                            <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
                                <h3 className={styles.sectionTitle} style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{t.detailed_breakdown}</h3>
                                <div className={styles.grid} style={{ marginTop: '1rem' }}>
                                    {results.domains && Object.entries(results.domains).map(([key, value]) => {
                                        const d = key as Domain;
                                        const level = getLevel(value.percentile).toLowerCase() as 'low' | 'average' | 'high';
                                        const insight = (bigFiveInsights as any)[d];

                                        const name = language === 'ml' ? insight.name_ml : insight.name;
                                        const description = (language === 'en' && results.nuancedInsights && results.nuancedInsights[d])
                                            ? results.nuancedInsights[d]
                                            : (language === 'ml' ? insight[level + '_ml'] : insight[level]);

                                        const isHigh = level === 'high';
                                        const badgeClass = isHigh ? styles.badgePrimary : level === 'low' ? styles.badgeWarning : styles.badgeSecondary;

                                        return (
                                            <div key={key} style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    <h4 style={{ color: '#1e293b', margin: 0, fontWeight: 700 }}>{name}</h4>
                                                    <span className={`${styles.badge} ${badgeClass}`}>
                                                        {t.levels[level] || level}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: '1.6', margin: 0 }}>{description}</p>
                                            </div>
                                        );
                                    })}
                                    {!results.domains && <p>Detailed breakdown available for Big5 assessment only.</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NEW: Psychological Capital Section */}
                    {hero && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>{t.advanced_insights.hero_title}</h2>
                            <p className={styles.textMuted} style={{ marginBottom: '1.5rem' }}>{t.advanced_insights.hero_desc}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                {((['hope', 'efficacy', 'resilience', 'optimism'] as const)).map(key => {
                                    const val = hero[key];
                                    const label = (t.advanced_insights.hero as any)[key];
                                    const icon = key === 'hope' ? '🌱' : key === 'efficacy' ? '⚡' : key === 'resilience' ? '🛡️' : '☀️';
                                    const color = key === 'hope' ? '#10b981' : key === 'efficacy' ? '#3b82f6' : key === 'resilience' ? '#f59e0b' : '#ec4899';

                                    return (
                                        <div key={key} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
                                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>{label}</h3>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: color }}>{Math.round(val)}%</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* NEW: Motivation Drivers */}
                    {drivers.length > 0 && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>{t.advanced_insights.drivers_title}</h2>
                            <div className={styles.card}>
                                {drivers.map(d => (
                                    <div key={d.id} style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 600, color: '#334155' }}>{d.name}</span>
                                            <span style={{ fontWeight: 700, color: '#475569' }}>{Math.round(d.score)}%</span>
                                        </div>
                                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${d.score}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '4px' }}></div>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>{d.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* NEW: Learning Style */}
                    {learningStyle && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>{t.advanced_insights.learning_title}</h2>
                            <div className={styles.card} style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderLeft: '6px solid #f59e0b' }}>
                                <h3 style={{ color: '#92400e', marginBottom: '0.5rem' }}>{learningStyle.style}</h3>
                                <p style={{ color: '#78350f', lineHeight: '1.6', marginBottom: '1rem' }}>{learningStyle.description}</p>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {learningStyle.tips.map((tip, i) => (
                                        <span key={i} style={{ background: 'rgba(255,255,255,0.6)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem', color: '#92400e', fontWeight: 600 }}>
                                            {tip}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NEW: Synergy Matrix */}
                    {synergies.length > 0 && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>{t.advanced_insights.synergy_title}</h2>
                            <div className={styles.grid}>
                                {synergies.map((s, idx) => (
                                    <div key={idx} className={styles.card} style={{ borderTop: `4px solid ${s.type === 'strength' ? '#22c55e' : '#f59e0b'}` }}>
                                        <h3 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>{s.name}</h3>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            {s.traits.map(t => (
                                                <span key={t} style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#64748b' }}>{t}</span>
                                            ))}
                                        </div>
                                        <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.5' }}>{s.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* Broad Career Categories */}
                    {broadCategories.length > 0 && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>{t.advanced_insights.broad_career_title || "Broad Career Paths"}</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {broadCategories.map((cat: any) => (
                                    <div key={cat.id} className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                                        <div className="text-5xl mb-4 p-4 bg-slate-50 rounded-full">
                                            {cat.id === 'entrepreneur' && '🚀'}
                                            {cat.id === 'corporate' && '💼'}
                                            {cat.id === 'academia' && '🎓'}
                                            {cat.id === 'creative' && '🎨'}
                                            {cat.id === 'social' && '🤝'}
                                            {cat.id === 'tech' && '💻'}
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-center mb-2 text-lg">{cat.name}</h4>
                                        <span className={`text-sm font-bold px-3 py-1 rounded-full mb-3 ${cat.fit === 'High' ? 'bg-emerald-100 text-emerald-700' :
                                            cat.fit === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                                'bg-rose-100 text-rose-700'
                                            }`}>
                                            {cat.fit === 'High' ? (t.advanced_insights.fit_high || "High Fit") :
                                                cat.fit === 'Medium' ? (t.advanced_insights.fit_med || "Medium Fit") :
                                                    (t.advanced_insights.fit_low || "Low Fit")}
                                        </span>
                                        <p className="text-sm text-slate-500 text-center leading-relaxed">{cat.reason}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.section}>
                        <div className={styles.aiSection} style={{ textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ fontSize: '2rem' }}>✨</div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b', fontWeight: 800, textAlign: 'left' }}>
                                        {userDetails?.name ? `${userDetails.name}'s Premium Analysis` : 'Premium Personality Analysis'}
                                    </h2>
                                    <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.95rem', textAlign: 'left' }}>
                                        <span style={{ color: '#4f46e5', fontWeight: 600 }}>Elite Coach Mode</span>
                                    </p>
                                </div>
                            </div>

                            {analysisError && (
                                <div className={styles.alert}>
                                    {analysisError}
                                    <button onClick={() => window.location.reload()} style={{ marginLeft: '10px', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}>Retry</button>
                                </div>
                            )}

                            {isAnalyzing && (
                                <div style={{ padding: '4rem 0', textAlign: 'center' }}>
                                    <div className="spinner" style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #e0e7ff', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1.5rem' }}></div>
                                    <h4 style={{ margin: 0, color: '#334155', fontSize: '1.1rem' }}>Analyzing profile...</h4>
                                    <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>Generating personalized insights</p>
                                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                                </div>
                            )}



                            {aiAnalysis && (
                                <div className={styles.aiGrid}>
                                    {(() => {
                                        const sections = aiAnalysis.split(/##\s+/).filter(Boolean);
                                        return sections.map((section, idx) => {
                                            const lines = section.trim().split('\n');
                                            const title = lines[0].replace(/^\d+\.\s*/, '').trim();
                                            const content = lines.slice(1).join('\n').trim();

                                            return (
                                                <div key={idx} className={styles.aiCard} style={{ textAlign: 'left' }}>
                                                    <h3 className={styles.aiCardTitle} style={{ textAlign: 'left' }}>
                                                        {idx === 0 ? '💡' : idx === 1 ? '🚀' : idx === 2 ? '⚠️' : idx === 3 ? '🎯' : '🛡️'} {title}
                                                    </h3>
                                                    <div className={styles.markdownContent} style={{ padding: 0, background: 'none', boxShadow: 'none', border: 'none', textAlign: 'left' }}>
                                                        <ReactMarkdown>{content}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>{t.career_intelligence.title}</h2>
                        <div className={styles.comparisonGrid} style={{ marginTop: '2rem', display: 'block' }}>
                            <h3 className={styles.cardTitle} style={{ marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
                                Comprehensive Role Analysis (Ranked by Fit)
                            </h3>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                                gap: '0.5rem'
                            }}>
                                {sortedCareers.map((career: any, idx: number) => {
                                    const score = career.matchScore;
                                    let color = '#475569';
                                    let bg = '#f1f5f9';
                                    let border = '#cbd5e1';

                                    if (score >= 90) {
                                        color = '#15803d'; // Deep Green
                                        bg = '#dcfce7';
                                        border = '#22c55e';
                                    } else if (score >= 80) {
                                        color = '#0d9488'; // Teal
                                        bg = '#ccfbf1';
                                        border = '#14b8a6';
                                    } else if (score >= 70) {
                                        color = '#0369a1'; // Blue
                                        bg = '#e0f2fe';
                                        border = '#38bdf8';
                                    } else if (score >= 50) {
                                        color = '#b45309'; // Amber
                                        bg = '#fef3c7';
                                        border = '#fcd34d';
                                    } else {
                                        color = '#b91c1c'; // Red
                                        bg = '#fee2e2';
                                        border = '#f87171';
                                    }

                                    return (
                                        <div key={idx} style={{
                                            backgroundColor: 'white',
                                            border: `1px solid ${border}`,
                                            borderTop: `3px solid ${color}`,
                                            borderRadius: '4px',
                                            padding: '0.5rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                            minHeight: '80px'
                                        }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.7rem', color: '#1e293b', lineHeight: 1.2, wordBreak: 'break-word' }}>{career.title}</h4>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                                <span style={{
                                                    fontSize: '0.6rem',
                                                    fontWeight: 600,
                                                    textTransform: 'uppercase',
                                                    color: color,
                                                    display: 'none' // Hide label to save space on tiny cards? Or keep barely visible.
                                                }}>
                                                    {/* {label} - Hide label for density */}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    fontWeight: 800,
                                                    color: color,
                                                    background: bg,
                                                    padding: '1px 4px',
                                                    borderRadius: '3px',
                                                    marginLeft: 'auto' // Align right
                                                }}>
                                                    {score}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className={styles.resultsCard}>
                        <h3>{t.detailed_facet_analysis.title}</h3>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                            {t.detailed_facet_analysis.description}
                        </p>

                        {results.domains && Object.entries(results.domains).map(([domainKey, domainValue]) => {
                            const d = domainKey as Domain;
                            const domainName = (bigFiveInsights as any)[d].name;
                            const domainNameTranslated = language === 'ml' ? (bigFiveInsights as any)[d].name_ml : domainName;

                            return (
                                <div key={domainKey} style={{ marginBottom: '2rem' }}>
                                    <h4 style={{
                                        fontSize: '1.1rem',
                                        color: '#1e293b',
                                        borderBottom: '2px solid #e2e8f0',
                                        paddingBottom: '0.5rem',
                                        marginBottom: '1rem'
                                    }}>
                                        {domainNameTranslated} ({getLevel(domainValue.percentile)})
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                        {[1, 2, 3, 4, 5, 6].map(num => {
                                            const facetKey = `${d}${num}`;
                                            const facetScore = results.facets?.[facetKey];
                                            if (!facetScore) return null;

                                            const facetText = (facetsText as any)[facetKey];
                                            const level = getLevel(facetScore.percentile);
                                            const levelLowerCase = level.toLowerCase() as 'low' | 'average' | 'high';

                                            const facetName = language === 'ml' ? facetText?.name_ml : facetText?.name;
                                            const facetDesc = language === 'ml' ? facetText?.[level + '_ml'] : facetText?.[level];

                                            return (
                                                <div key={facetKey} style={{
                                                    background: '#f8fafc',
                                                    padding: '1rem',
                                                    borderRadius: '8px',
                                                    borderLeft: `4px solid ${level === 'High' ? '#3b82f6' :
                                                        level === 'Low' ? '#94a3b8' : '#cbd5e1'
                                                        }`
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                        <span style={{ fontWeight: 600, color: '#334155' }}>{facetName || facetKey}</span>
                                                        <span style={{
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '12px',
                                                            background: level === 'High' ? '#dbeafe' : level === 'Low' ? '#f1f5f9' : '#e2e8f0',
                                                            color: level === 'High' ? '#1e40af' : level === 'Low' ? '#64748b' : '#475569',
                                                            fontWeight: 500
                                                        }}>
                                                            {t.levels[levelLowerCase] || level}
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                                                        {facetDesc || 'Analysis unavailable.'}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {results.answers && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>{t.detailed_response_analysis.title}</h2>
                            <div className={styles.tableContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '60%' }}>{t.detailed_response_analysis.question_header}</th>
                                            <th>{t.detailed_response_analysis.your_answer_header}</th>
                                            <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0' }}>{t.detailed_response_analysis.trait_header}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(Object.entries(results.answers || {}) as [string, number][]).map(([itemId, value], index) => {
                                            // @ts-ignore
                                            const item = itemsData.find(i => i.id === itemId);
                                            return (
                                                <tr key={itemId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '1rem', color: '#334155' }}>{item ? (language === 'ml' ? item.text_ml : item.text) : `${t.detailed_response_analysis.question_label} ${index + 1}`}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '12px',
                                                            background: value > 3 ? '#dcfce7' : value < 3 ? '#fee2e2' : '#f1f5f9',
                                                            color: value > 3 ? '#166534' : value < 3 ? '#991b1b' : '#475569',
                                                            fontWeight: 500
                                                        }}>
                                                            {Number(value) === 1 ? 'Strongly Disagree' :
                                                                Number(value) === 2 ? 'Disagree' :
                                                                    Number(value) === 3 ? 'Neutral' :
                                                                        Number(value) === 4 ? 'Agree' : 'Strongly Agree'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem', color: '#64748b' }}>
                                                        {item ? (language === 'ml' ? (bigFiveInsights as any)[item.domain]?.name_ml : (bigFiveInsights as any)[item.domain]?.name || item.domain) : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.downloadSection} style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button className="btn btn-secondary" onClick={resetAssessment}>
                    {t.retake_btn || "Retake Assessment"}
                </button>
            </div>
        </div >
    );
};

export default ResultsDashboard;
