import React, { useRef, useState } from 'react';
import { useAssessment } from '../../context/AssessmentContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from 'recharts';
import html2canvas from 'html2canvas';
import allCareers from '../../data/all_careers.json';
import facetsText from '../../data/facets_text.json';
import styles from './ResultsDashboard.module.css';
import PDFReport from '../Report/PDFReport';
import { HiddenCharts } from '../Report/HiddenCharts';
import careerIntelligence from '../../data/career_intelligence.json';
import bigFiveInsights from '../../data/big_five_insights.json';
import itemsData from '../../data/items.json';
import { getLevel } from '../../core/scoring';


const ResultsDashboard: React.FC = () => {
    const { results, resetAssessment, currentCareer, currentCareerCode, answers } = useAssessment();
    const hiddenChartsRef = useRef<HTMLDivElement>(null);
    const [chartImage, setChartImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    if (!results) return null;

    const domainColors = {
        N: '#ef4444', // Red for Neuroticism
        E: '#f72585', // Pink for Extraversion
        O: '#4361ee', // Blue for Openness
        A: '#4cc9f0', // Light Blue for Agreeableness
        C: '#3a0ca3'  // Purple for Conscientiousness
    };

    const domainData = Object.entries(results.domains).map(([key, value]) => ({
        name: (bigFiveInsights as any)[key].name, // Use full name
        key: key,
        score: value.percentile,
        fullMark: 100,
        fill: (domainColors as any)[key]
    }));

    const radarData = Object.entries(results.domains).map(([key, value]) => ({
        subject: (bigFiveInsights as any)[key].name,
        A: value.percentile,
        fullMark: 100,
    }));

    // Get Primary Trait (First letter of RIASEC)
    const primaryCode = results.topRiasec.charAt(0) as keyof typeof careerIntelligence;
    const primaryInsight = (careerIntelligence as any)[primaryCode];

    // Get Combination Insight if available
    const comboInsight = (careerIntelligence as any).combinations[results.topRiasec];

    const generatePdfImage = async () => {
        if (hiddenChartsRef.current) {
            setIsGenerating(true);
            try {
                const canvas = await html2canvas(hiddenChartsRef.current);
                const imgData = canvas.toDataURL('image/png');
                setChartImage(imgData);
            } catch (error) {
                console.error("Failed to generate chart image", error);
            } finally {
                setIsGenerating(false);
            }
        }
    };

    // Helper to calculate a deterministic match score
    const calculateMatchScore = (userCode: string, careerCode: string, careerTitle: string): number => {
        if (!userCode || !careerCode) return 50;

        const userPrimary = userCode.charAt(0);
        const userSecondary = userCode.charAt(1);
        const userTertiary = userCode.charAt(2);

        const careerPrimary = careerCode.charAt(0);
        const careerSecondary = careerCode.charAt(1) || '';
        const careerTertiary = careerCode.charAt(2) || '';

        let score = 60; // Base score

        // Primary Match
        if (careerPrimary === userPrimary) score += 25;
        else if (careerPrimary === userSecondary) score += 15;
        else if (careerPrimary === userTertiary) score += 10;

        // Secondary Match
        if (careerSecondary === userPrimary) score += 10;
        else if (careerSecondary === userSecondary) score += 10;
        else if (careerSecondary === userTertiary) score += 5;

        // Tertiary Match
        if (careerTertiary === userPrimary) score += 5;
        else if (careerTertiary === userSecondary) score += 5;
        else if (careerTertiary === userTertiary) score += 5;

        // --- CRITICAL TRAIT PENALTIES (Point 5) ---
        // Executive / Leadership roles necessitate High Conscientiousness (Industriousness/Order)
        // and usually Low Neuroticism (Volatility).
        const isExecutive = /Chief|Executive|Manager|Director|Lead|Head|Owner|Founder/i.test(careerTitle);

        if (isExecutive) {
            const cPercentile = results.domains.C.percentile;
            const nAnger = results.facets['N2']?.percentile || 50;
            const cIndustriousness = results.facets['C4']?.percentile || 50; // Achievement Striving

            // Penalty for Low Conscientiousness in Leadership
            if (cPercentile < 40) score -= 20;
            if (cIndustriousness < 30) score -= 15; // Lazy leader matches poorly

            // Penalty for High Volatility in Leadership
            if (nAnger > 70) score -= 15;
        }

        return Math.min(99, Math.max(10, score));
    };

    // Calculate matches for ALL careers
    const safeAllCareers = Array.isArray(allCareers) ? allCareers : [];
    const scoredCareers = safeAllCareers.map(career => ({
        ...career,
        matchScore: calculateMatchScore(results.topRiasec, career.code, career.title)
    }));

    // Top 10 Matches
    const topMatches = [...scoredCareers]
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);

    // Top 10 Avoid (Lowest Match Scores)
    const rolesToAvoid = [...scoredCareers]
        .sort((a, b) => a.matchScore - b.matchScore)
        .slice(0, 10)
        .map(c => ({ ...c, burnoutRisk: 100 - c.matchScore })); // Invert score for risk

    // Calculate Current Career Fit
    let currentCareerFit = 0;
    try {
        if (currentCareer && currentCareerCode) {
            currentCareerFit = calculateMatchScore(results.topRiasec, currentCareerCode, currentCareer);
        } else if (currentCareer) {
            const exactMatch = safeAllCareers.find(c => c.title.toLowerCase() === currentCareer.toLowerCase());
            if (exactMatch) {
                currentCareerFit = calculateMatchScore(results.topRiasec, exactMatch.code, exactMatch.title);
            } else {
                currentCareerFit = 50;
            }
        }
    } catch (e) {
        console.error("Error calculating career fit", e);
        currentCareerFit = 50;
    }

    // Helper for answer labels
    const getAnswerLabel = (val: number) => {
        switch (val) {
            case 1: return "Strongly Disagree";
            case 2: return "Disagree";
            case 3: return "Neutral";
            case 4: return "Agree";
            case 5: return "Strongly Agree";
            default: return "-";
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <HiddenCharts ref={hiddenChartsRef} results={results} />

            {/* Current Career Fit Section */}
            {currentCareer && (
                <div className={styles.section}>
                    <div className={styles.card} style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: 'white' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'white' }}>Current Role Analysis</h2>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
                            <div>
                                <p style={{ color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>
                                    Your Current Role
                                </p>
                                <h3 style={{ fontSize: '2rem', margin: 0 }}>{currentCareer}</h3>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 800, color: currentCareerFit > 70 ? '#4ade80' : '#facc15' }}>
                                    {currentCareerFit}%
                                </div>
                                <span style={{ color: '#cbd5e1' }}>Personality Fit Score</span>
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
                        <p style={{ marginTop: '1rem', color: '#cbd5e1', fontSize: '0.95rem' }}>
                            {currentCareerFit > 80 ? "This role aligns exceptionally well with your natural personality traits." :
                                currentCareerFit > 60 ? "This role is a reasonable fit, though some aspects may require adaptation." :
                                    "This role may require significant energy expenditure to maintain, potentially leading to faster burnout."}
                        </p>
                    </div>
                </div>
            )}

            {/* Consistency & Reliability Warnings (Point 3) */}
            {results.consistencyFlags && results.consistencyFlags.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.card} style={{ borderLeft: '4px solid #f59e0b' }}>
                        <h3 style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ⚠️ Response Consistency Checks
                        </h3>
                        <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
                            Our system detected some contradictory answers in your response pattern. This happens sometimes when questions are subtle, but it's worth noting for the accuracy of your report.
                        </p>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {results.consistencyFlags.map((flag, idx) => (
                                <div key={idx} style={{ background: '#fffbeb', padding: '1rem', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                                    <p style={{ margin: 0, color: '#92400e', fontSize: '0.95rem' }}>
                                        <strong>Potential Contradiction:</strong> {flag.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Personality Profile (Big Five)</h2>
                <div className={styles.grid}>
                    <div className={styles.chartCard}>
                        <h3>Domain Percentiles</h3>
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
                        <h3>Profile Shape</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Percentile" dataKey="A" stroke="#4361ee" strokeWidth={3} fill="#4361ee" fillOpacity={0.3} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
                        <h3>Detailed Trait Analysis</h3>
                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                            {Object.entries(results.domains).map(([key, value]) => {
                                const level = getLevel(value.percentile).toLowerCase() as 'low' | 'average' | 'high';
                                const insight = (bigFiveInsights as any)[key];
                                // Use Nuanced Insight if available, else fallback to standard
                                const description = results.nuancedInsights ? (results.nuancedInsights as any)[key] : insight[level];

                                return (
                                    <div key={key} style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <h4 style={{ color: '#1e293b', margin: 0 }}>{insight.name}</h4>
                                            <span className={`badge ${getLevel(value.percentile).toLowerCase() === 'high' ? 'badge-primary' : 'badge-secondary'}`}
                                                style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>
                                                {getLevel(value.percentile)}
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
                <h2 className={styles.sectionTitle}>Career Intelligence</h2>

                {/* Hero Card for Code & Characteristics */}
                <div className={styles.heroCard}>
                    <div className={styles.heroContent}>
                        <div className={styles.codeCircle}>
                            <span className={styles.codeLabel}>Your Code</span>
                            <span className={styles.codeValue}>{results.topRiasec}</span>
                        </div>
                        <div className={styles.codeDetails}>
                            <p className={styles.codeDescription}>{primaryInsight?.description}</p>

                            <div className={styles.characteristicsContainer}>
                                <h4 className={styles.charTitle}>Key Characteristics</h4>
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
                                💡 Insight: {comboInsight.title}
                            </h4>
                            <p className={styles.insightText}>{comboInsight.description}</p>
                        </div>
                    )}
                </div>

                <div className={styles.splitGrid}>
                    {/* Career Matches Card */}
                    <div className={styles.card}>
                        <h3 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Top 10 Career Matches</h3>
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
                                        <span className={styles.matchLabel}>Match</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Roles to Avoid Card */}
                    <div className={styles.card} style={{ borderTop: '4px solid #ef4444' }}>
                        <h3 style={{ color: '#ef4444', marginBottom: '1.5rem' }}>Roles to Avoid</h3>
                        <p style={{ marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                            Based on your profile, these roles have the highest mismatch:
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
                                        <span className={styles.matchLabel} style={{ color: '#ef4444' }}>Risk</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Answer Table */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Detailed Response Analysis</h2>
                <div className={styles.card} style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0' }}>Question</th>
                                <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0' }}>Your Answer</th>
                                <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0' }}>Trait</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(answers).map(([itemId, value], index) => {
                                // In a real app, we'd look up the item text from items.json
                                // Since we don't have items imported here directly as a list to find, 
                                // we might need to import itemsData again or pass it.
                                // Assuming itemsData is available or we can find it.
                                // Let's try to find it in the imported allCareers? No.
                                // We need to import itemsData.
                                const item = (itemsData as any[]).find(i => i.id === itemId);
                                return (
                                    <tr key={itemId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem', color: '#334155' }}>{item ? item.text : `Question ${index + 1}`}</td>
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
                                            {item ? `${(bigFiveInsights as any)[item.domain]?.name || item.domain}` : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed Facet Analysis (Scientific Refinement) */}
            <div className={styles.resultsCard}>
                <h3>Detailed Personality Breakdown</h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                    Your broad traits are made up of specific sub-traits (facets). This breakdown reveals the nuance in your personality.
                </p>

                {Object.entries(results.domains).map(([domainKey, domainValue]) => {
                    const domainName = (bigFiveInsights as any)[domainKey].name;
                    return (
                        <div key={domainKey} style={{ marginBottom: '2rem' }}>
                            <h4 style={{
                                fontSize: '1.1rem',
                                color: '#1e293b',
                                borderBottom: '2px solid #e2e8f0',
                                paddingBottom: '0.5rem',
                                marginBottom: '1rem'
                            }}>
                                {domainName} ({getLevel(domainValue.percentile)})
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                {[1, 2, 3, 4, 5, 6].map(num => {
                                    const facetKey = `${domainKey}${num}`;
                                    const facetScore = results.facets[facetKey];
                                    // Safety check if facet score exists
                                    if (!facetScore) return null;

                                    const facetText = (facetsText as any)[facetKey];
                                    const level = getLevel(facetScore.percentile);

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
                                                <span style={{ fontWeight: 600, color: '#334155' }}>{facetText?.name || facetKey}</span>
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    background: level === 'High' ? '#dbeafe' : level === 'Low' ? '#f1f5f9' : '#e2e8f0',
                                                    color: level === 'High' ? '#1e40af' : level === 'Low' ? '#64748b' : '#475569',
                                                    fontWeight: 500
                                                }}>
                                                    {level}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                                                {facetText ? facetText[level] : 'Analysis unavailable.'}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.downloadSection}>
                {!chartImage ? (
                    <button
                        className="btn btn-primary"
                        style={{ marginRight: '1rem' }}
                        onClick={generatePdfImage}
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'Preparing Report...' : 'Prepare PDF Report'}
                    </button>
                ) : (
                    <button
                        className="btn btn-primary"
                        style={{ marginRight: '1rem' }}
                        onClick={async () => {
                            console.log("Starting PDF download process...");
                            try {
                                const { pdf } = await import('@react-pdf/renderer');
                                console.log("Renderer imported.");

                                const doc = <PDFReport results={results} chartImage={chartImage} />;
                                const asPdf = pdf(doc);
                                console.log("PDF instance created.");

                                const blob = await asPdf.toBlob();
                                console.log("Blob generated:", blob.size, blob.type);

                                const url = URL.createObjectURL(blob);
                                console.log("URL created:", url);

                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `psychometric-report-${new Date().toISOString().split('T')[0]}.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                console.log("Click triggered.");

                                document.body.removeChild(link);

                                // Delay revocation to ensure download starts
                                setTimeout(() => {
                                    URL.revokeObjectURL(url);
                                    console.log("Cleanup done.");
                                }, 1000);
                            } catch (error) {
                                console.error("Failed to download PDF", error);
                                alert("Failed to generate PDF. Check console for details.");
                            }
                        }}
                    >
                        Download PDF Report
                    </button>
                )}

                <button className="btn btn-secondary" onClick={resetAssessment}>
                    Retake Assessment
                </button>
            </div>
        </div >
    );
};

export default ResultsDashboard;
