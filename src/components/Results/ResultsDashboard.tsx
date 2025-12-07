import React, { useRef, useState, useEffect } from 'react';
import { useAssessment } from '../../context/AssessmentContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import html2canvas from 'html2canvas';
import { PDFDownloadLink } from '@react-pdf/renderer';
import Chart from 'chart.js/auto';

import allCareers from '../../data/all_careers.json';
import facetsText from '../../data/facets_text.json';
import styles from './ResultsDashboard.module.css';
import PDFDocument from '../Report/PDFReport'; // Renamed import to avoid visual confusion, though file is PDFReport.tsx
import { HiddenCharts } from '../Report/HiddenCharts';
import careerIntelligence from '../../data/career_intelligence.json';
import bigFiveInsights from '../../data/big_five_insights.json';
import itemsData from '../../data/items.json';
import { getLevel } from '../../core/scoring';
import { translations } from '../../data/translations';
import type { Domain } from '../../types';

const ResultsDashboard: React.FC = () => {
    const { results, resetAssessment, currentCareer, isGenerating, language } = useAssessment();
    const t = translations[language].results;

    const hiddenChartsRef = useRef<HTMLDivElement>(null);
    const [chartImage, setChartImage] = useState<string | null>(null);
    const [isPreparingPdf, setIsPreparingPdf] = useState(false);

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

        const labels = Object.keys(results.domains).map(d => {
            const domain = d as Domain;
            // @ts-ignore
            return language === 'ml' ? bigFiveInsights[domain].name_ml : bigFiveInsights[domain].name;
        });

        const data = Object.values(results.domains).map(r => r.percentile);

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

    const domainColors = {
        N: '#ef4444',
        E: '#f72585',
        O: '#4361ee',
        A: '#4cc9f0',
        C: '#3a0ca3'
    };

    const domainData = Object.entries(results.domains).map(([key, value]) => ({
        name: language === 'ml' ? (bigFiveInsights as any)[key].name_ml : (bigFiveInsights as any)[key].name,
        key: key,
        score: value.percentile,
        fullMark: 100,
        fill: (domainColors as any)[key]
    }));



    const primaryCode = results.topRiasec.charAt(0) as keyof typeof careerIntelligence;
    const primaryInsight = (careerIntelligence as any)[primaryCode];
    const comboInsight = (careerIntelligence as any).combinations[results.topRiasec];

    const generatePdfImage = async () => {
        if (hiddenChartsRef.current) {
            setIsPreparingPdf(true);
            try {
                const canvas = await html2canvas(hiddenChartsRef.current);
                const imgData = canvas.toDataURL('image/png');
                setChartImage(imgData);
            } catch (error) {
                console.error("Failed to generate chart image", error);
            } finally {
                setIsPreparingPdf(false);
            }
        }
    };

    const calculateMatchScore = (userCode: string, careerCode: string, careerTitle: string): number => {
        if (!userCode || !careerCode) return 50;

        const userPrimary = userCode.charAt(0);
        const userSecondary = userCode.charAt(1);
        const userTertiary = userCode.charAt(2);

        const careerPrimary = careerCode.charAt(0);
        const careerSecondary = careerCode.charAt(1) || '';
        const careerTertiary = careerCode.charAt(2) || '';

        let score = 60;

        if (careerPrimary === userPrimary) score += 25;
        else if (careerPrimary === userSecondary) score += 15;
        else if (careerPrimary === userTertiary) score += 10;

        if (careerSecondary === userPrimary) score += 10;
        else if (careerSecondary === userSecondary) score += 10;
        else if (careerSecondary === userTertiary) score += 5;

        if (careerTertiary === userPrimary) score += 5;
        else if (careerTertiary === userSecondary) score += 5;
        else if (careerTertiary === userTertiary) score += 5;

        const isExecutive = /Chief|Executive|Manager|Director|Lead|Head|Owner|Founder/i.test(careerTitle);

        if (isExecutive) {
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
    const scoredCareers = safeAllCareers.map(career => ({
        ...career,
        matchScore: calculateMatchScore(results.topRiasec, career.code, career.title)
    }));

    const topMatches = [...scoredCareers]
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);

    const rolesToAvoid = [...scoredCareers]
        .sort((a, b) => a.matchScore - b.matchScore)
        .slice(0, 10)
        .map(c => ({ ...c, burnoutRisk: 100 - c.matchScore }));

    let currentCareerFit = 0;
    try {
        if (currentCareer) {
            // Try to find exact match first if we don't have code
            const match = safeAllCareers.find(c => c.title.toLowerCase() === currentCareer.toLowerCase());
            if (match) {
                currentCareerFit = calculateMatchScore(results.topRiasec, match.code, match.title);
            } else {
                currentCareerFit = 50; // Default if not found
            }
        }
    } catch (e) {
        console.error("Error calculating career fit", e);
        currentCareerFit = 50;
    }

    const getAnswerLabel = (val: number) => {
        switch (val) {
            case 1: return t.strongly_disagree;
            case 2: return t.disagree;
            case 3: return t.neutral;
            case 4: return t.agree;
            case 5: return t.strongly_agree;
            default: return "-";
        }
    };

    return (
        <div className={styles.dashboardContainer} style={{ paddingBottom: '4rem' }}>
            <HiddenCharts ref={hiddenChartsRef} results={results} />

            <header className={styles.header}>
                <h1>{t.hero_title}</h1>

                {/* PDF Download Button Logic */}
                {!chartImage ? (
                    <button
                        className="btn btn-primary"
                        onClick={generatePdfImage}
                        disabled={isPreparingPdf}
                    >
                        {isPreparingPdf ? t.preparing_pdf : t.prepare_pdf}
                    </button>
                ) : (
                    <PDFDownloadLink
                        document={<PDFDocument results={results} chartImage={chartImage} language={language} />}
                        fileName={`personality_report_${language}.pdf`}
                        className="btn btn-primary"
                    >
                        {({ loading }) => loading ? t.completing : t.download_pdf}
                    </PDFDownloadLink>
                )}
            </header>

            {currentCareer && (
                <div className={styles.section}>
                    <div className={styles.card} style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: 'white' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'white' }}>{t.current_role_analysis}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
                            <div>
                                <p style={{ color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>
                                    {t.assessing_for}
                                </p>
                                <h3 style={{ fontSize: '2rem', margin: 0 }}>{currentCareer}</h3>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 800, color: currentCareerFit > 70 ? '#4ade80' : '#facc15' }}>
                                    {currentCareerFit}%
                                </div>
                                <span style={{ color: '#cbd5e1' }}>{t.fit_score_label}</span>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${currentCareerFit}%`,
                                height: '100%',
                                background: currentCareerFit > 70 ? '#4ade80' : '#facc15',
                                transition: 'width 1s ease'
                            }}></div>
                        </div>
                    </div>
                </div>
            )}

            {results.consistencyFlags && results.consistencyFlags.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.card} style={{ borderLeft: '4px solid #f59e0b' }}>
                        <h3 style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ⚠️ {t.consistency_title}
                        </h3>
                        <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
                            {t.consistency_desc}
                        </p>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {results.consistencyFlags.map((flag, idx) => (
                                <div key={idx} style={{ background: '#fffbeb', padding: '1rem', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                                    <p style={{ margin: 0, color: '#92400e', fontSize: '0.95rem' }}>
                                        <strong>{t.potential_contradiction}:</strong> {flag.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>{t.profile_domains}</h2>
                <div className={styles.grid}>
                    <div className={styles.chartCard}>
                        <h3>{t.domain_percentiles}</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={domainData} layout="vertical" margin={{ left: 40, right: 20, top: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#475569', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={30}>
                                    {domainData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className={styles.chartCard}>
                        <h3>{t.profile_shape}</h3>
                        {/* We use the canvas for Chart.js here */}
                        <canvas ref={chartRef} style={{ maxHeight: '350px' }}></canvas>
                    </div>

                    <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
                        <h3>{t.detailed_breakdown}</h3>
                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                            {Object.entries(results.domains).map(([key, value]) => {
                                const d = key as Domain;
                                const level = getLevel(value.percentile).toLowerCase() as 'low' | 'average' | 'high';
                                const insight = (bigFiveInsights as any)[d];

                                const name = language === 'ml' ? insight.name_ml : insight.name;
                                // Nuanced insight is English only for now, fallback to static if ML
                                const description = (language === 'en' && results.nuancedInsights && results.nuancedInsights[d])
                                    ? results.nuancedInsights[d]
                                    : (language === 'ml' ? insight[level + '_ml'] : insight[level]);

                                return (
                                    <div key={key} style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <h4 style={{ color: '#1e293b', margin: 0 }}>{name}</h4>
                                            <span className={`badge ${getLevel(value.percentile).toLowerCase() === 'high' ? 'badge-primary' : 'badge-secondary'}`}
                                                style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>
                                                {t.levels[level] || level}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: '1.5' }}>{description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>{t.career_intelligence.title}</h2>

                <div className={styles.heroCard}>
                    <div className={styles.heroContent}>
                        <div className={styles.codeCircle}>
                            <span className={styles.codeLabel}>{t.career_intelligence.your_code}</span>
                            <span className={styles.codeValue}>{results.topRiasec}</span>
                        </div>
                        <div className={styles.codeDetails}>
                            <p className={styles.codeDescription}>{primaryInsight?.description}</p>

                            <div className={styles.characteristicsContainer}>
                                <h4 className={styles.charTitle}>{t.career_intelligence.characteristics}</h4>
                                <div className={styles.charTags}>
                                    {primaryInsight?.strengths.map((char: string, i: number) => (
                                        <span key={i} className={styles.charTag}>
                                            {char}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {comboInsight && (
                        <div className={styles.insightBox}>
                            <h4 className={styles.insightTitle}>
                                💡 {t.career_intelligence.insight_label}: {comboInsight.title}
                            </h4>
                            <p className={styles.insightText}>{comboInsight.description}</p>
                        </div>
                    )}
                </div>

                <div className={styles.splitGrid}>
                    <div className={styles.card}>
                        <h3 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>{t.career_intelligence.top_matches_title}</h3>
                        <div className={styles.careerList}>
                            {topMatches.map((career, index) => (
                                <div key={index} className={styles.careerCard}>
                                    <div className={styles.careerIcon}>
                                        {career.title.charAt(0)}
                                    </div>
                                    <div className={styles.careerInfo}>
                                        <h4>{career.title}</h4>
                                        <div className={styles.progressBarContainer}>
                                            <div className={styles.progressBar} style={{ width: `${career.matchScore}%` }}></div>
                                        </div>
                                    </div>
                                    <div className={styles.matchScore}>
                                        <span className={styles.matchPercent}>{career.matchScore}%</span>
                                        <span className={styles.matchLabel}>{t.career_intelligence.match_label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.card} style={{ borderTop: '4px solid #ef4444' }}>
                        <h3 style={{ color: '#ef4444', marginBottom: '1.5rem' }}>{t.career_intelligence.roles_to_avoid_title}</h3>
                        <p style={{ marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                            {t.career_intelligence.roles_to_avoid_description}
                        </p>
                        <div className={styles.careerList}>
                            {rolesToAvoid.map((career, index) => (
                                <div key={index} className={styles.careerCard} style={{ borderColor: '#fecaca' }}>
                                    <div className={styles.careerIcon} style={{ background: '#fef2f2', color: '#ef4444' }}>
                                        ⚠️
                                    </div>
                                    <div className={styles.careerInfo}>
                                        <h4>{career.title}</h4>
                                        <div className={styles.progressBarContainer} style={{ background: '#fef2f2' }}>
                                            <div className={styles.progressBar} style={{ width: `${career.burnoutRisk}%`, background: '#ef4444' }}></div>
                                        </div>
                                    </div>
                                    <div className={styles.matchScore}>
                                        <span className={styles.matchPercent} style={{ color: '#ef4444' }}>{career.burnoutRisk}%</span>
                                        <span className={styles.matchLabel} style={{ color: '#ef4444' }}>{t.career_intelligence.risk_label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>{t.detailed_response_analysis.title}</h2>
                <div className={styles.card} style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0' }}>{t.detailed_response_analysis.question_header}</th>
                                <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0' }}>{t.detailed_response_analysis.your_answer_header}</th>
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
                                                {getAnswerLabel(value)}
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

            <div className={styles.resultsCard}>
                <h3>{t.detailed_facet_analysis.title}</h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                    {t.detailed_facet_analysis.description}
                </p>

                {Object.entries(results.domains).map(([domainKey, domainValue]) => {
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
                                    const facetScore = results.facets[facetKey];
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
                                                    fontSize: '0.8rem',
                                                    padding: '2px 8px',
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

            <div className={styles.downloadSection} style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button className="btn btn-secondary" onClick={resetAssessment}>
                    {t.retake_btn || "Retake Assessment"}
                </button>
            </div>
        </div>
    );
};

export default ResultsDashboard;
