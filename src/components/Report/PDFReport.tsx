import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { AssessmentResult } from '../../types';
import careerIntelligence from '../../data/career_intelligence.json';
import bigFiveInsights from '../../data/big_five_insights.json';
import { getLevel } from '../../core/scoring';
import { translations } from '../../data/translations';
import { Domain } from '../../types';

// Register a font that supports Malayalam if available, otherwise fallback might fail.
// Since we don't have a local font file, we rely on standard fonts which might not support ML.
// Ideally: Font.register({ family: 'NotoSansMalayalam', src: 'path/to/font.ttf' });

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 40,
        fontFamily: 'Helvetica', // Warning: Helvetica doesn't support Malayalam.
    },
    header: {
        marginBottom: 20,
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 5,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4338ca',
        marginBottom: 10,
        marginTop: 10,
    },
    text: {
        fontSize: 10,
        lineHeight: 1.5,
        color: '#374151',
        marginBottom: 5,
    },
    chartContainer: {
        marginVertical: 10,
        alignItems: 'center',
    },
    chartImage: {
        width: 500,
        height: 300,
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingVertical: 5,
    },
    col1: {
        width: '70%',
    },
    col2: {
        width: '30%',
        textAlign: 'right',
    },
    list: {
        marginLeft: 15,
    },
    listItem: {
        fontSize: 10,
        color: '#374151',
        marginBottom: 3,
    },
    warningBox: {
        padding: 10,
        backgroundColor: '#fef2f2',
        borderLeftWidth: 3,
        borderLeftColor: '#ef4444',
        marginTop: 10,
    }
});

interface PDFReportProps {
    results: AssessmentResult;
    chartImage: string | null;
    language?: 'en' | 'ml';
}

const PDFReport: React.FC<PDFReportProps> = ({ results, chartImage, language = 'en' }) => {
    const t = translations[language].results;

    // Get Insights
    const primaryCode = results.topRiasec.charAt(0) as keyof typeof careerIntelligence;
    const primaryInsight = (careerIntelligence as any)[primaryCode];
    const comboInsight = (careerIntelligence as any).combinations[results.topRiasec];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t.hero_title}</Text>
                    <Text style={styles.subtitle}>IPIP-NEO-120 & Holland Code Analysis</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.career_intelligence.title}</Text>
                    <Text style={styles.text}>
                        {/* Fallback code description - usually these are English only unless we translated career_intelligence.json */}
                        {comboInsight ? comboInsight.description : primaryInsight?.description}
                    </Text>
                    <Text style={styles.text}>
                        {t.career_intelligence.your_code}: {results.topRiasec}
                    </Text>
                </View>

                {chartImage && (
                    <View style={styles.chartContainer}>
                        <Image src={chartImage} style={styles.chartImage} />
                    </View>
                )}

                {/* Consistency Checks */}
                {results.consistencyFlags && results.consistencyFlags.length > 0 && (
                    <View style={[styles.warningBox, { backgroundColor: '#fffbeb', borderLeftColor: '#f59e0b' }]}>
                        <Text style={[styles.sectionTitle, { color: '#d97706', fontSize: 12 }]}>{t.consistency_title}</Text>
                        <Text style={styles.text}>{t.consistency_desc}</Text>
                        <View style={styles.list}>
                            {results.consistencyFlags.map((flag, i) => (
                                <Text key={i} style={styles.listItem}>• {flag.message}</Text>
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.detailed_breakdown}</Text>
                    {Object.entries(results.domains).map(([key, value]) => {
                        const d = key as Domain;
                        const level = getLevel(value.percentile).toLowerCase() as 'low' | 'average' | 'high';
                        const insight = (bigFiveInsights as any)[d];

                        const name = language === 'ml' ? insight.name_ml : insight.name;
                        const description = (language === 'en' && results.nuancedInsights && results.nuancedInsights[d])
                            ? results.nuancedInsights[d]
                            : (language === 'ml' ? insight[level + '_ml'] : insight[level]);

                        return (
                            <View key={key} style={{ marginBottom: 8 }}>
                                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1f2937' }}>
                                    {name} ({t.levels[level] || level})
                                </Text>
                                <Text style={styles.text}>{description}</Text>
                            </View>
                        );
                    })}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.career_intelligence.characteristics}</Text>
                    <View style={styles.list}>
                        {primaryInsight?.strengths.map((s: string, i: number) => (
                            <Text key={i} style={styles.listItem}>• {s}</Text>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.career_intelligence.top_matches_title}</Text>
                    <View style={{ marginTop: 5 }}>
                        {results.careers.map((career, idx) => (
                            <View key={idx} style={styles.row}>
                                <Text style={[styles.text, styles.col1]}>{career.title}</Text>
                                <Text style={[styles.text, styles.col2]}>Zone {career.zone}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={[styles.warningBox, { marginTop: 20 }]}>
                    <Text style={[styles.sectionTitle, { color: '#b91c1c', fontSize: 12 }]}>{t.career_intelligence.roles_to_avoid_title}</Text>
                    <Text style={styles.text}>{t.career_intelligence.roles_to_avoid_description}</Text>
                    <View style={styles.list}>
                        {primaryInsight?.anti_roles.map((role: string, i: number) => (
                            <Text key={i} style={styles.listItem}>• {role}</Text>
                        ))}
                    </View>
                </View>

                <Text style={{ position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, textAlign: 'center', color: '#9ca3af' }}>
                    Generated by Client-Side Psychometric System
                </Text>
            </Page>
        </Document>
    );
};

export default PDFReport;
