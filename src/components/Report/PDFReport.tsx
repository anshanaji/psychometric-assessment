import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import type { AssessmentResult } from '../../types';
import careerIntelligence from '../../data/career_intelligence.json';
import bigFiveInsights from '../../data/big_five_insights.json';
import facetsText from '../../data/facets_text.json';
import { getLevel } from '../../core/scoring';
import { translations } from '../../data/translations';
import type { Domain } from '../../types';
import {
    deriveMotivationDrivers,
    deriveExcellenceProfile,
    identifySynergies,
    deriveLearningStyle,
    evaluateBroadCareerCategories
} from '../../core/advancedInsights';

// ... styles remain same ...
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#1f2937'
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4
    },
    subtitle: {
        fontSize: 12,
        color: '#6b7280',
    },
    section: {
        marginBottom: 20,
        paddingBottom: 10,
    },
    heroSection: {
        backgroundColor: '#f8fafc',
        padding: 20,
        borderRadius: 8,
        marginBottom: 20,
        alignItems: 'center'
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: 'extrabold',
        color: '#4f46e5',
        marginBottom: 5
    },
    heroSubtitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 10
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
        borderBottomWidth: 2,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 4,
        marginBottom: 10,
        marginTop: 10,
    },
    subTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 4,
        marginTop: 6
    },
    text: {
        fontSize: 10,
        lineHeight: 1.6,
        color: '#4b5563',
        marginBottom: 4,
        textAlign: 'justify'
    },
    list: {
        marginLeft: 10,
        marginTop: 5
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    bullet: {
        width: 10,
        fontSize: 10,
        color: '#6b7280'
    },
    listItemContent: {
        flex: 1,
        fontSize: 10,
        color: '#4b5563'
    },
    chartContainer: {
        marginVertical: 15,
        alignItems: 'center',
        height: 300
    },
    chartImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain'
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingVertical: 6,
        alignItems: 'center'
    },
    colLabel: { width: '70%', fontSize: 10, color: '#374151' },
    colValue: { width: '30%', fontSize: 10, textAlign: 'right', color: '#6b7280' },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 8,
        fontWeight: 'bold',
        backgroundColor: '#e0e7ff',
        color: '#3730a3'
    },
    warningBox: {
        backgroundColor: '#fffbeb',
        borderLeftWidth: 3,
        borderLeftColor: '#f59e0b',
        padding: 10,
        marginTop: 10,
        marginBottom: 10
    },
    gridBox: {
        padding: 8,
        backgroundColor: '#ffffff',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 8,
        alignItems: 'center'
    },
    progressBar: {
        height: 4,
        backgroundColor: '#e5e7eb',
        borderRadius: 2,
        marginTop: 4,
        marginBottom: 4,
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        borderRadius: 2
    }
});

interface PDFReportProps {
    results: AssessmentResult;
    chartImage: string | null;
    language?: 'en' | 'ml';
    rolesToAvoid?: any[];
    allCareers?: any[];
    userName?: string;
}

const PDFReport: React.FC<PDFReportProps> = ({ results, chartImage, language = 'en', rolesToAvoid, allCareers, userName }) => {
    const t = translations[language].results;
    const isMbti = results.assessmentType === 'mbti' && results.mbti;

    const drivers = results?.domains ? deriveMotivationDrivers(results.domains, language) : [];
    const synergies = results?.domains ? identifySynergies(results.domains, language) : [];
    const hero = results?.domains ? deriveExcellenceProfile(results.domains) : null;
    const learningStyle = results?.domains ? deriveLearningStyle(results.domains, language) : null;
    const broadCategories = results?.domains ? evaluateBroadCareerCategories(results.domains, language) : [];

    // Determine Report Title
    const baseTitle = isMbti ? `Personality Report` : t.hero_title; // "Your Personality Profile" usually
    const reportTitle = userName ? `${userName}'s Personality Profile` : baseTitle;
    const reportSubtitle = isMbti ? "MBTI Assessment Analysis" : "IPIP-NEO-120 & Holland Code Analysis";
    const primaryCode = results.topRiasec ? results.topRiasec.charAt(0) as keyof typeof careerIntelligence : 'R';
    const primaryInsight = results.topRiasec ? (careerIntelligence as any)[primaryCode] : null;
    const comboInsight = results.topRiasec ? (careerIntelligence as any).combinations[results.topRiasec] : null;

    const renderAIAnalysis = (text: string) => {
        if (!text) return null;
        return text.split('\n').map((line, idx) => {
            const clean = line.trim();
            if (!clean) return null;
            if (clean.startsWith('##')) {
                return <Text key={idx} style={[styles.subTitle, { fontSize: 12, marginTop: 8, color: '#4338ca' }]}>{clean.replace(/^##\s*/, '')}</Text>;
            } else if (clean.startsWith('*')) {
                return (
                    <View key={idx} style={styles.listItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.listItemContent}>{clean.replace(/^\*\s*/, '').replace(/\*\*/g, '')}</Text>
                    </View>
                );
            }
            return <Text key={idx} style={styles.text}>{clean}</Text>;
        });
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* ... Header & Hero ... */}
                <View style={styles.header}>
                    <Text style={styles.title}>{reportTitle}</Text>
                    <Text style={styles.subtitle}>{reportSubtitle} • {new Date().toLocaleDateString()}</Text>
                </View>

                {/* HERO SECTION */}
                <View style={styles.heroSection}>
                    {isMbti && results.mbti ? (
                        <>
                            <Text style={styles.heroTitle}>{results.mbti.type}</Text>
                            <Text style={styles.heroSubtitle}>{results.mbti.details.name}</Text>
                            <Text style={[styles.text, { textAlign: 'center' }]}>{results.mbti.details.description}</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.heroTitle}>{results.topRiasec}</Text>
                            <Text style={styles.heroSubtitle}>{t.profile_domains || "Career Personality Profile"}</Text>
                            <Text style={[styles.text, { textAlign: 'center' }]}>
                                {comboInsight ? comboInsight.description : primaryInsight?.description}
                            </Text>
                        </>
                    )}
                </View>

                {/* AI ANALYSIS (Common) */}
                {results.aiAnalysis && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Premium Personality Analysis</Text>
                        <Text style={{ fontSize: 9, color: '#64748b', marginBottom: 10 }}>Elite Coach Mode</Text>
                        <View>{renderAIAnalysis(results.aiAnalysis)}</View>
                    </View>
                )}

                {/* CHART (Common) */}
                {chartImage && (
                    <View style={styles.section} break={false}>
                        <Text style={styles.sectionTitle}>{t.profile_shape || "Personality Radar"}</Text>
                        <View style={styles.chartContainer}>
                            <Image src={chartImage} style={styles.chartImage} />
                        </View>
                    </View>
                )}

                {/* ADVANCED INSIGHTS SECTION */}
                {hero && (
                    <View style={styles.section} break>
                        <Text style={styles.sectionTitle}>{t.advanced_insights.hero_title}</Text>
                        <Text style={[styles.text, { marginBottom: 10 }]}>{t.advanced_insights.hero_desc}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                            {(['hope', 'efficacy', 'resilience', 'optimism'] as const).map(key => {
                                const val = hero[key];
                                const label = (t.advanced_insights.hero as any)[key];
                                return (
                                    <View key={key} style={{ width: '23%', padding: 10, backgroundColor: '#f8fafc', alignItems: 'center', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' }}>
                                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#334155', marginBottom: 4 }}>{label}</Text>
                                        <Text style={{ fontSize: 14, fontWeight: 'extrabold', color: key === 'hope' ? '#10b981' : key === 'efficacy' ? '#3b82f6' : key === 'resilience' ? '#f59e0b' : '#ec4899' }}>{Math.round(val)}%</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {drivers.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t.advanced_insights.drivers_title}</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                            {drivers.map(d => (
                                <View key={d.id} style={{ width: '48%', marginBottom: 10 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                                        <Text style={{ fontSize: 9, fontWeight: 'bold', width: '80%' }}>{d.name}</Text>
                                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{Math.round(d.score)}%</Text>
                                    </View>
                                    <View style={{ height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden', marginBottom: 2 }}>
                                        <View style={{ width: `${d.score}%`, height: '100%', backgroundColor: '#6366f1' }} />
                                    </View>
                                    <Text style={{ fontSize: 8, color: '#64748b' }}>{d.description}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {
                    learningStyle && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t.advanced_insights.learning_title}</Text>
                            <View style={{ padding: 12, backgroundColor: '#fffbeb', borderLeftWidth: 4, borderLeftColor: '#f59e0b', borderRadius: 4 }}>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#92400e', marginBottom: 4 }}>{learningStyle.style}</Text>
                                <Text style={{ fontSize: 9, color: '#78350f', marginBottom: 8 }}>{learningStyle.description}</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                    {learningStyle.tips.map((tip, i) => (
                                        <Text key={i} style={{ fontSize: 8, backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, color: '#92400e', marginRight: 4, marginBottom: 2 }}>• {tip}</Text>
                                    ))}
                                </View>
                            </View>
                        </View>
                    )
                }

                {
                    synergies.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t.advanced_insights.synergy_title}</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                {synergies.map((s, idx) => (
                                    <View key={idx} style={{ width: '48%', padding: 10, borderWidth: 1, borderColor: s.type === 'strength' ? '#22c55e' : '#f59e0b', borderRadius: 4, marginBottom: 8 }}>
                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 }}>{s.name}</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
                                            <Text style={{ fontSize: 8, backgroundColor: '#f1f5f9', paddingHorizontal: 4, borderRadius: 2, color: '#64748b' }}>{s.traits.join(' + ')}</Text>
                                        </View>
                                        <Text style={{ fontSize: 8, color: '#334155' }}>{s.description}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )
                }
                {
                    isMbti && results.mbti && (
                        <>
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>{language === 'ml' ? 'കഴിവുകൾ (Strengths)' : 'Strengths'}</Text>
                                {results.mbti.details.strengths?.map((s, i) => (
                                    <View key={i} style={styles.listItem}>
                                        <Text style={[styles.bullet, { color: '#16a34a' }]}>✓</Text>
                                        <Text style={styles.listItemContent}>{s}</Text>
                                    </View>
                                ))}
                            </View>
                            {/* ... Weaknesses & Work Style ... */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>{language === 'ml' ? 'ദൗർബല്യങ്ങൾ (Weaknesses)' : 'Weaknesses'}</Text>
                                {results.mbti.details.weaknesses?.map((w, i) => (
                                    <View key={i} style={styles.listItem}>
                                        <Text style={[styles.bullet, { color: '#dc2626' }]}>!</Text>
                                        <Text style={styles.listItemContent}>{w}</Text>
                                    </View>
                                ))}
                            </View>
                            {results.mbti.details.work_style && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>{language === 'ml' ? 'ജോലി ശൈലി (Work Style)' : 'Work Style'}</Text>
                                    <Text style={styles.text}>{results.mbti.details.work_style}</Text>
                                </View>
                            )}
                        </>
                    )
                }

                {/* DOMAIN BREAKDOWN (Common if data available) */}
                {
                    results.domains && (
                        <View style={styles.section} break>
                            <Text style={styles.sectionTitle}>{t.detailed_breakdown || "Detailed Trait Breakdown"}</Text>
                            {Object.entries(results.domains).map(([key, value]) => {
                                const d = key as Domain;
                                const level = getLevel(value.percentile);
                                const levelKey = level.toLowerCase() as 'low' | 'average' | 'high';
                                const insight = (bigFiveInsights as any)[d];
                                const name = language === 'ml' ? insight.name_ml : insight.name;
                                const desc = (language === 'en' && results.nuancedInsights && results.nuancedInsights[d])
                                    ? results.nuancedInsights[d]
                                    : (language === 'ml' ? insight[levelKey + '_ml'] : insight[levelKey]);

                                return (
                                    <View key={key} style={{ marginBottom: 10, padding: 10, backgroundColor: '#f9fafb', borderRadius: 4 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <Text style={{ fontWeight: 'bold', fontSize: 11 }}>{name}</Text>
                                            <Text style={{ fontSize: 10, color: '#4f46e5' }}>{t.levels[levelKey] || level}</Text>
                                        </View>
                                        <Text style={styles.text}>{desc}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    )
                }

                {/* ... Facets ... */}
                {
                    results.domains && results.facets && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t.detailed_facet_analysis?.title || "Detailed Facet Analysis"}</Text>
                            <Text style={[styles.text, { marginBottom: 10, fontStyle: 'italic' }]}>
                                {t.detailed_facet_analysis?.description || "A deeper look into the sub-traits that make up your personality profile."}
                            </Text>
                            {Object.keys(results.domains).map((d) => (
                                // ... render facets ...
                                <View key={d} style={{ marginBottom: 15 }}>
                                    <Text style={[styles.subTitle, { backgroundColor: '#e5e7eb', padding: 4 }]}>
                                        {(bigFiveInsights as any)[d]?.name || d}
                                    </Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                        {[1, 2, 3, 4, 5, 6].map(num => {
                                            const facetKey = `${d}${num}`;
                                            // @ts-ignore
                                            const facetValue = results.facets?.[facetKey];
                                            if (!facetValue) return null;

                                            const level = getLevel(facetValue.percentile);
                                            const fText = (facetsText as any)[facetKey];
                                            const fname = language === 'ml' ? fText?.name_ml : fText?.name;

                                            return (
                                                <View key={facetKey} style={{ width: '50%', paddingRight: 10, marginBottom: 8 }}>
                                                    <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{fname}</Text>
                                                    <Text style={{ fontSize: 8, color: level === 'High' ? '#1d4ed8' : level === 'Low' ? '#9ca3af' : '#4b5563' }}>
                                                        {level} - {fText?.[level] || ''}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )
                }

                {/* BROAD CAREER CATEGORIES (NEW) */}
                {broadCategories.length > 0 && (
                    <View style={styles.section} break>
                        <Text style={styles.sectionTitle}>{t.advanced_insights.broad_career_title}</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                            {broadCategories.map((cat: any, i: number) => (
                                <View key={i} style={{ width: '48%', padding: 8, borderWidth: 1, borderColor: '#e5e7eb', borderLeftWidth: 4, borderLeftColor: cat.color, borderRadius: 4, marginBottom: 10, backgroundColor: '#ffffff' }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#111827', width: '65%' }}>{cat.name}</Text>
                                        <Text style={{ fontSize: 8, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, backgroundColor: cat.fit === 'High' ? '#dcfce7' : cat.fit === 'Medium' ? '#fef3c7' : '#fee2e2', color: cat.fit === 'High' ? '#166534' : cat.fit === 'Medium' ? '#b45309' : '#991b1b', borderRadius: 2 }}>
                                            {cat.fit === 'High' ? (t.advanced_insights.fit_high || "High") :
                                                cat.fit === 'Medium' ? (t.advanced_insights.fit_med || "Med") :
                                                    (t.advanced_insights.fit_low || "Low")}
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 8, color: '#4b5563', lineHeight: 1.4 }}>{cat.reason}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* ALL CAREERS GRID (NEW) */}
                {
                    allCareers && allCareers.length > 0 && (
                        <View style={styles.section} break>
                            <Text style={styles.sectionTitle}>{t.career_intelligence?.top_matches_title || "Career Matches"}</Text>
                            <Text style={[styles.text, { marginBottom: 10 }]}>Full list of career matches ranked by compatibility.</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                                {allCareers.map((career, idx) => {
                                    const score = career.matchScore;
                                    let color = '#475569';
                                    let bg = '#f1f5f9';

                                    if (score >= 90) { color = '#15803d'; bg = '#dcfce7'; }
                                    else if (score >= 80) { color = '#0d9488'; bg = '#ccfbf1'; }
                                    else if (score >= 70) { color = '#0369a1'; bg = '#e0f2fe'; }
                                    else if (score >= 50) { color = '#b45309'; bg = '#fef3c7'; }
                                    else { color = '#b91c1c'; bg = '#fee2e2'; }

                                    return (
                                        <View key={idx} style={{
                                            width: '18%', // Approx 5 per row for PDF (A4 is narrow)
                                            marginRight: '2%',
                                            marginBottom: 8,
                                            padding: 4,
                                            backgroundColor: bg,
                                            borderRadius: 2,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: 40
                                        }}>
                                            <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#334155', textAlign: 'center', marginBottom: 2, maxHeight: 20 }}>{career.title.length > 25 ? career.title.substring(0, 22) + '...' : career.title}</Text>
                                            <Text style={{ fontSize: 8, fontWeight: 'extrabold', color: color }}>{score}%</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )
                }

                {/* ROLES TO AVOID */}
                {
                    rolesToAvoid && rolesToAvoid.length > 0 && (
                        <View style={styles.section} break>
                            <Text style={[styles.sectionTitle, { color: '#b91c1c' }]}>Roles to Avoid (High Burnout Risk)</Text>
                            {rolesToAvoid.map((role, idx) => (
                                <View key={idx} style={styles.tableRow}>
                                    <Text style={[styles.colLabel, { color: '#4b5563' }]}>{role.title}</Text>
                                    <Text style={[styles.colValue, { color: '#dc2626' }]}>{role.burnoutRisk}% Risk</Text>
                                </View>
                            ))}
                        </View>
                    )
                }

                {/* CONSISTENCY & FOOTER same as before */}
                {/* ... Consistency Flags ... */}
                {
                    results.consistencyFlags && results.consistencyFlags.length > 0 && (
                        <View style={styles.warningBox}>
                            <Text style={[styles.subTitle, { color: '#b45309' }]}>{t.consistency_title || "Consistency Checks"}</Text>
                            {results.consistencyFlags.map((flag, i) => (
                                <View key={i} style={styles.listItem}>
                                    <Text style={styles.bullet}>⚠️</Text>
                                    <Text style={styles.listItemContent}>{flag.message}</Text>
                                </View>
                            ))}
                        </View>
                    )
                }
                {/* Footer */}
                <Text style={{ position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, textAlign: 'center', color: '#9ca3af' }}>
                    Generated by Psychometric Assessment Platform • {new Date().getFullYear()}
                </Text>

            </Page >
        </Document >
    );
};

export default PDFReport;
