import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import type { AssessmentResult } from '../../types';
import careerIntelligence from '../../data/career_intelligence.json';
import bigFiveInsights from '../../data/big_five_insights.json';
import { getLevel } from '../../core/scoring';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 40,
        fontFamily: 'Helvetica',
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
}

const PDFReport: React.FC<PDFReportProps> = ({ results, chartImage }) => {
    // Get Insights
    const primaryCode = results.topRiasec.charAt(0) as keyof typeof careerIntelligence;
    const primaryInsight = (careerIntelligence as any)[primaryCode];
    const comboInsight = (careerIntelligence as any).combinations[results.topRiasec];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Psychometric Assessment Report</Text>
                    <Text style={styles.subtitle}>IPIP-NEO-120 & Holland Code Analysis</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Executive Summary</Text>
                    <Text style={styles.text}>
                        This report provides a comprehensive analysis of your personality traits based on the Five Factor Model
                        and your vocational interests based on the RIASEC theory.
                    </Text>
                    <Text style={styles.text}>
                        Your Holland Code is: {results.topRiasec}
                    </Text>
                    <Text style={styles.text}>
                        {comboInsight ? comboInsight.description : primaryInsight?.description}
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
                        <Text style={[styles.sectionTitle, { color: '#d97706', fontSize: 12 }]}>Reflect on your Consistency</Text>
                        <Text style={styles.text}>Some of your answers seemed contradictory:</Text>
                        <View style={styles.list}>
                            {results.consistencyFlags.map((flag, i) => (
                                <Text key={i} style={styles.listItem}>• {flag.message}</Text>
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detailed Personality Analysis</Text>
                    {Object.entries(results.domains).map(([key, value]) => {
                        const level = getLevel(value.percentile).toLowerCase() as 'low' | 'average' | 'high';
                        const insight = (bigFiveInsights as any)[key];
                        // Use Nuanced Insight
                        const description = results.nuancedInsights ? (results.nuancedInsights as any)[key] : insight[level];

                        return (
                            <View key={key} style={{ marginBottom: 8 }}>
                                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1f2937' }}>{insight.name} ({getLevel(value.percentile)})</Text>
                                <Text style={styles.text}>{description}</Text>
                            </View>
                        );
                    })}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Key Strengths</Text>
                    <View style={styles.list}>
                        {primaryInsight?.strengths.map((s: string, i: number) => (
                            <Text key={i} style={styles.listItem}>• {s}</Text>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Potential Blind Spots</Text>
                    <View style={styles.list}>
                        {primaryInsight?.weaknesses.map((w: string, i: number) => (
                            <Text key={i} style={styles.listItem}>• {w}</Text>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recommended Careers</Text>
                    <View style={{ marginTop: 5 }}>
                        {results.careers.map((career, idx) => (
                            <View key={idx} style={styles.row}>
                                <Text style={[styles.text, styles.col1]}>{career.title}</Text>
                                <Text style={[styles.text, styles.col2]}>Zone {career.zone}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.warningBox}>
                    <Text style={[styles.sectionTitle, { color: '#b91c1c', fontSize: 12 }]}>Roles to Avoid</Text>
                    <Text style={styles.text}>Based on your profile, these roles may be draining:</Text>
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
