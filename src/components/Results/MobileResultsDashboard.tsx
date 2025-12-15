import React, { useState, useRef } from 'react';
import { useAssessment } from '../../context/AssessmentContext';
import styles from './ResultsDashboard.module.css'; // Re-use some styles, but we'll apply mobile-specific overrides inline or via new classes
import { SmartCareerGrid } from './SmartCareerGrid';
import { getRankedCareersV2 } from '../../core/careerMatching';
import allCareers from '../../data/all_careers.json';
import { Download } from 'lucide-react';

import { deriveExcellenceProfile, deriveFlowState, deriveLeadershipArchetype, deriveConflictStyle, deriveBurnoutTriggers, deriveCommunicationGuide } from '../../core/advancedInsights';
// @ts-ignore
import html2pdf from 'html2pdf.js';

// Mobile Specific Sub-components could go here or be imported
// But for density, we'll keep it in one file for now or split if it grows large.

interface MobileDashboardProps {
    onPaymentReq: () => void;
}

export const MobileResultsDashboard: React.FC<MobileDashboardProps> = ({ onPaymentReq }) => {
    const { results, userDetails, hasPaid } = useAssessment();
    const [activeTab, setActiveTab] = useState<'overview' | 'careers' | 'insights'>('overview');
    const [isGenerating, setIsGenerating] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    // Derive Strategies for PDF
    const flowState = results?.domains ? deriveFlowState(results.domains, 'en') : null;
    const leadershipStyle = results?.domains ? deriveLeadershipArchetype(results.domains, 'en') : null;
    const conflictStyle = results?.domains ? deriveConflictStyle(results.domains, 'en') : null;
    const burnoutTrigger = results?.domains ? deriveBurnoutTriggers(results.domains, 'en') : null;
    const commGuide = results?.domains ? deriveCommunicationGuide(results.domains, 'en') : null;

    const handleDownloadReport = async () => {
        if (!reportRef.current) return;
        setIsGenerating(true);
        const element = reportRef.current;
        const opt: any = {
            margin: [0.5, 0.5],
            filename: `Career_Report_${userDetails?.name || 'User'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        try {
            await html2pdf().set(opt).from(element).save();
        } catch (err) {
            console.error("PDF Generation failed", err);
        } finally {
            setIsGenerating(false);
        }
    };

    if (!results) return <div className="p-4">Loading results...</div>;

    // Advanced Insights Derivation
    const hero = results?.domains ? deriveExcellenceProfile(results.domains) : null;

    // Calculate Careers
    const safeAllCareers = Array.isArray(allCareers) ? allCareers : [];
    const matchInput = results.riasec || results.topRiasec || '';
    const { top25 } = getRankedCareersV2(
        safeAllCareers,
        matchInput,
        results.riskFlags,
        userDetails?.profession || ''
    );

    // Mobile specific styles (inline for speed/isolation or reused from module)
    const containerStyle: React.CSSProperties = {
        padding: '16px',
        paddingBottom: '100px', // Space for bottom bar
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: '#f8fafc',
        minHeight: '100vh',
    };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        position: 'sticky',
        top: 0,
        background: '#f8fafc',
        zIndex: 50,
        padding: '12px 0',
        borderBottom: '1px solid #e2e8f0'
    };

    const tabStyle = (isActive: boolean): React.CSSProperties => ({
        flex: 1,
        textAlign: 'center',
        padding: '12px',
        fontSize: '0.9rem',
        fontWeight: 600,
        color: isActive ? '#4f46e5' : '#64748b',
        borderBottom: isActive ? '2px solid #4f46e5' : '1px solid #e2e8f0',
        background: 'white',
        cursor: 'pointer'
    });

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span className={styles.archetypeBadge}>Your Archetype</span>
                <h2 className={styles.identityTitle} style={{ fontSize: '2rem', marginTop: '10px' }}>
                    {hero?.title || "The Strategist"}
                </h2>
                <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.5' }}>
                    {userDetails?.profession ? `Optimized for ${userDetails.profession}` : "Career Intelligence Report"}
                </p>
            </div>

            {/* Simple Trait List instead of crowded Radar Chart */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: '#1e293b' }}>Top Traits</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.entries(results.domains || {}).sort(([, a]: any, [, b]: any) => b.percentile - a.percentile).slice(0, 3).map(([key, data]: any) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{key}</span>
                            <div style={{ width: '60%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${data.percentile}%`, height: '100%', background: key === 'Neuroticism' ? '#ef4444' : '#4f46e5' }}></div>
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{Math.round(data.percentile)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderCareers = () => (
        <div>
            <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #dbeafe' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e40af', marginBottom: '8px' }}>Top Matches</h3>
                <p style={{ fontSize: '0.9rem', color: '#1e3a8a' }}>Based on your personality and current role.</p>
            </div>
            {/* Pass only top 10 to SmartCareerGrid for mobile speed */}
            <SmartCareerGrid careers={top25.slice(0, 10)} />

            <div style={{ marginTop: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                {!hasPaid ? "Unlock to see 40+ more careers" : "View on desktop for full list"}
            </div>
        </div>
    );

    const renderInsights = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!hasPaid ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔒</div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Premium Insights</h3>
                    <p style={{ color: '#64748b', marginBottom: '16px' }}>Unlock deep psychological analysis, burnout triggers, and leadership style.</p>
                    <button
                        onClick={onPaymentReq}
                        style={{
                            background: '#4f46e5', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '99px', fontWeight: 700, width: '100%'
                        }}
                    >
                        Unlock Now
                    </button>
                </div>
            ) : (
                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px' }}>Communication Style</h3>
                    <p style={{ lineHeight: '1.6', color: '#334155' }}>
                        {/* Placeholder for complex text logic - can import advanced functions if needed */}
                        Your communication style is direct and analytical. You prefer data over intuition.
                    </p>
                </div>
            )}
        </div>
    );

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}>AntiGravity</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4f46e5' }}>Beta</div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', marginBottom: '24px', position: 'sticky', top: '56px', zIndex: 40 }}>
                <div onClick={() => setActiveTab('overview')} style={tabStyle(activeTab === 'overview')}>Overview</div>
                <div onClick={() => setActiveTab('careers')} style={tabStyle(activeTab === 'careers')}>Careers</div>
                <div onClick={() => setActiveTab('insights')} style={tabStyle(activeTab === 'insights')}>Insights</div>
            </div>

            {/* Content Area */}
            <div className="animate-fade-in">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'careers' && renderCareers()}
                {activeTab === 'insights' && renderInsights()}
            </div>

            {/* Sticky Bottom Actions */}
            {!hasPaid && (
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    background: 'white', padding: '16px',
                    borderTop: '1px solid #e2e8f0', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)'
                }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Full Access</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>₹499</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {hasPaid ? (
                            <button
                                onClick={handleDownloadReport}
                                disabled={isGenerating}
                                style={{
                                    background: '#4f46e5', color: 'white', border: 'none',
                                    padding: '10px 24px', borderRadius: '8px', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    opacity: isGenerating ? 0.7 : 1
                                }}
                            >
                                <Download size={18} />
                                {isGenerating ? 'Generating...' : 'Download PDF'}
                            </button>
                        ) : (
                            <button
                                onClick={onPaymentReq}
                                style={{
                                    background: '#4f46e5', color: 'white', border: 'none',
                                    padding: '10px 24px', borderRadius: '8px', fontWeight: 700
                                }}
                            >
                                Unlock Report
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Hidden Desktop Report for PDF Generation */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '1200px' }}>
                <div ref={reportRef} className={styles.dashboardContainer} style={{ background: 'white', padding: '40px' }}>
                    {/* Clean Header for PDF */}
                    <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px' }}>
                        <h1 style={{ fontSize: '2.5rem', color: '#1e293b', marginBottom: '10px' }}>{userDetails?.name || 'User'}'s Profile</h1>
                        <p style={{ fontSize: '1.2rem', color: '#64748b' }}>Career Intelligence Report • {new Date().toLocaleDateString()}</p>
                    </div>

                    {/* Hero Section Recreated */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Executive Summary</h2>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                            <div className={styles.card} style={{ flex: 1, textAlign: 'center', borderTop: '4px solid #4f46e5' }}>
                                <h3 style={{ fontSize: '1.5rem', color: '#4f46e5', marginBottom: '5px' }}>Archetype</h3>
                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{hero?.title || 'The Strategist'}</div>
                            </div>
                            <div className={styles.card} style={{ flex: 1, textAlign: 'center', borderTop: '4px solid #0ea5e9' }}>
                                <h3 style={{ fontSize: '1.5rem', color: '#0ea5e9', marginBottom: '5px' }}>Top Career Match</h3>
                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{top25[0]?.title || 'Analyst'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Traits Breakdown */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Trait Profile</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {Object.entries(results.domains || {}).map(([key, data]: any) => (
                                <div key={key} style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ fontWeight: 700 }}>{key}</span>
                                        <span>{Math.round(data.percentile)}%</span>
                                    </div>
                                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px' }}>
                                        <div style={{ width: `${data.percentile}%`, height: '100%', background: '#4f46e5', borderRadius: '4px' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Career Matches (Existing) */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Top Career Matches</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                            {top25.slice(0, 15).map((career, idx) => (
                                <div key={idx} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{career.title}</div>
                                    <div style={{ color: '#166534', fontSize: '0.8rem', fontWeight: 700 }}>{Math.round(career.matchScore)}% Match</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Expert Strategy Profile (Added & Moved to Bottom) */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Expert Strategy Profile</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {flowState && (
                                <div style={{ padding: '15px', background: '#eff6ff', borderRadius: '8px' }}>
                                    <h3 style={{ fontSize: '1rem', color: '#1e40af', marginBottom: '5px' }}>🌊 Flow State</h3>
                                    <div style={{ fontWeight: 700, marginBottom: '5px' }}>{flowState.trigger}</div>
                                    <p style={{ fontSize: '0.85rem', color: '#1e3a8a' }}>{flowState.description}</p>
                                </div>
                            )}
                            {leadershipStyle && (
                                <div style={{ padding: '15px', background: '#f5f3ff', borderRadius: '8px' }}>
                                    <h3 style={{ fontSize: '1rem', color: '#5b21b6', marginBottom: '5px' }}>👑 Leadership</h3>
                                    <div style={{ fontWeight: 700, marginBottom: '5px' }}>{leadershipStyle.archetype}</div>
                                    <p style={{ fontSize: '0.85rem', color: '#4c1d95' }}>{leadershipStyle.description}</p>
                                </div>
                            )}
                            {conflictStyle && (
                                <div style={{ padding: '15px', background: '#fff7ed', borderRadius: '8px' }}>
                                    <h3 style={{ fontSize: '1rem', color: '#9a3412', marginBottom: '5px' }}>⚔️ Conflict Style</h3>
                                    <div style={{ fontWeight: 700, marginBottom: '5px' }}>{conflictStyle.style}</div>
                                    <p style={{ fontSize: '0.85rem', color: '#7c2d12' }}>{conflictStyle.description}</p>
                                </div>
                            )}
                            {burnoutTrigger && (
                                <div style={{ padding: '15px', background: '#fef2f2', borderRadius: '8px' }}>
                                    <h3 style={{ fontSize: '1rem', color: '#991b1b', marginBottom: '5px' }}>🛡️ Burnout Risk</h3>
                                    <div style={{ fontWeight: 700, marginBottom: '5px' }}>{burnoutTrigger.trigger}</div>
                                    <p style={{ fontSize: '0.85rem', color: '#7f1d1d' }}>{burnoutTrigger.prevention}</p>
                                </div>
                            )}
                            {commGuide && (
                                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>🗣️ Communication Manual</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '8px' }}>
                                            <h4 style={{ color: '#166534', margin: '0 0 10px 0' }}>✅ Do This</h4>
                                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#15803d' }}>
                                                {commGuide.dos.map((d, i) => <li key={i}>{d}</li>)}
                                            </ul>
                                        </div>
                                        <div style={{ background: '#fef2f2', padding: '15px', borderRadius: '8px' }}>
                                            <h4 style={{ color: '#991b1b', margin: '0 0 10px 0' }}>❌ Avoid This</h4>
                                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#b91c1c' }}>
                                                {commGuide.donts.map((d, i) => <li key={i}>{d}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
