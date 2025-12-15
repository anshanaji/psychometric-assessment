import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Item, UserAnswers, AssessmentResult } from '../types';
import itemsData from '../data/items.json';
import normsData from '../data/norms.json';
import careersData from '../data/careers.json';
import { generateReport } from '../core/scoring';
import { calculateRiasecScores, getTopRiasecCode } from '../core/riasec';

import mbtiItems from '../data/mbti_items.json';
import { calculateMbti } from '../core/mbti_scoring';
import type { AssessmentType } from '../types';

interface AssessmentContextType {
    currentStep: number;
    totalSteps: number;
    answers: UserAnswers;
    handleAnswer: (answer: number) => void;
    setAnswer: (itemId: string, value: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    results: AssessmentResult | null;
    isGenerating: boolean;
    language: 'en' | 'ml';
    setLanguage: (lang: 'en' | 'ml') => void;
    setResults: (results: AssessmentResult | null) => void; // Add setResults
    fillRandomAnswers: () => void;
    finishAssessment: () => void;
    resetAssessment: () => void;
    isComplete: boolean;
    currentCareer: string | null;
    setCurrentCareer: (career: string) => void;
    assessmentType: AssessmentType;
    setAssessmentType: (type: AssessmentType) => void;

    // New Personalization Fields
    userDetails: { name: string; age: string; profession: string };
    setUserDetails: (details: { name: string; age: string; profession: string }) => void;

    // Assessment Flow Logic
    isStarted: boolean; // Tracks if user has clicked "Start"
    startAssessment: () => void;
    hasPaid: boolean;
    setHasPaid: (val: boolean) => void;
    unlockReport: () => void;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<UserAnswers>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<AssessmentResult | null>(null);
    const [language, setLanguage] = useState<'en' | 'ml'>('en');
    const [currentCareer, setCurrentCareer] = useState<string | null>(null);
    const [assessmentType, setAssessmentType] = useState<AssessmentType>('big5');
    const [isStarted, setIsStarted] = useState(false);

    // New State for User Details
    const [userDetails, setUserDetails] = useState({ name: '', age: '', profession: '' });

    // Payment Logic
    const [hasPaid, setHasPaid] = useState(false);

    // Dynamically load items based on type
    const items = (assessmentType === 'big5' ? itemsData : mbtiItems) as Item[];
    const totalSteps = items.length;

    // Load state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('assessment_session');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.answers) setAnswers(parsed.answers);
                if (parsed.currentStep !== undefined) setCurrentStep(parsed.currentStep);
                if (parsed.language) setLanguage(parsed.language);
                if (parsed.results) setResults(parsed.results);
                if (parsed.currentCareer) setCurrentCareer(parsed.currentCareer);
                if (parsed.assessmentType) setAssessmentType(parsed.assessmentType);
                if (parsed.userDetails) setUserDetails(parsed.userDetails);
                if (parsed.isStarted !== undefined) setIsStarted(parsed.isStarted);
                if (parsed.hasPaid !== undefined) setHasPaid(parsed.hasPaid);
            } catch (e) {
                console.error("Failed to load session", e);
                localStorage.removeItem('assessment_session');
            }
        }
    }, []);


    // Save state to localStorage on change
    useEffect(() => {
        localStorage.setItem('assessment_session', JSON.stringify({ answers, currentStep, language, results, currentCareer, assessmentType, userDetails, isStarted, hasPaid }));
    }, [answers, currentStep, language, results, currentCareer, assessmentType, userDetails, isStarted, hasPaid]);

    const generateResults = (finalAnswers: UserAnswers) => {
        setIsGenerating(true);
        setTimeout(() => {
            if (assessmentType === 'big5') {
                // @ts-ignore
                const { domainResults, facetResults, nuancedInsights, consistencyFlags } = generateReport(finalAnswers, items, normsData);
                const riasecScores = calculateRiasecScores(domainResults);
                const topRiasec = getTopRiasecCode(riasecScores);

                // Career Lookup Logic
                let matchedCareers = (careersData as any)[topRiasec] || [];

                if (matchedCareers.length === 0) {
                    const perms = [
                        topRiasec,
                        topRiasec[0] + topRiasec[2] + topRiasec[1],
                        topRiasec[1] + topRiasec[0] + topRiasec[2],
                        topRiasec[1] + topRiasec[2] + topRiasec[0],
                        topRiasec[2] + topRiasec[0] + topRiasec[1],
                        topRiasec[2] + topRiasec[1] + topRiasec[0]
                    ];
                    for (const p of perms) {
                        if ((careersData as any)[p]) {
                            matchedCareers = (careersData as any)[p];
                            break;
                        }
                    }
                }
                if (matchedCareers.length === 0) {
                    const twoLetter = topRiasec.substring(0, 2);
                    const allKeys = Object.keys(careersData);
                    for (const key of allKeys) {
                        if (key.startsWith(twoLetter)) {
                            matchedCareers = [...matchedCareers, ...(careersData as any)[key]];
                        }
                    }
                }

                // Deduplicate and limit
                matchedCareers = Array.from(new Set(matchedCareers)).slice(0, 20);

                const resultData: AssessmentResult = {
                    domains: domainResults,
                    facets: facetResults,
                    riasec: riasecScores,
                    topRiasec,
                    careers: matchedCareers,
                    nuancedInsights: nuancedInsights || {},
                    consistencyFlags: consistencyFlags || [],
                    answers: finalAnswers,
                    assessmentType: 'big5'
                };
                setResults(resultData);
            } else {
                // MBTI Logic
                const mbtiResult = calculateMbti(finalAnswers, language);
                const resultData: AssessmentResult = {
                    assessmentType: 'mbti',
                    mbti: mbtiResult,
                    careers: mbtiResult.details.careers,
                    answers: finalAnswers
                };
                setResults(resultData);
            }
            setIsGenerating(false);
        }, 1500);
    };

    const handleAnswer = (answer: number) => {
        const currentItem = items[currentStep];
        const newAnswers = { ...answers, [currentItem.id]: answer };
        setAnswers(newAnswers);

        // Auto advance if not last step
        if (currentStep < totalSteps - 1) {
            setTimeout(() => setCurrentStep(prev => prev + 1), 250);
        } else {
            generateResults(newAnswers);
        }
    };

    const resetAssessment = () => {
        setAnswers({});
        setCurrentStep(0);
        setResults(null);
        setCurrentCareer(null);
        setIsStarted(false); // Reset start state
        setHasPaid(false); // Reset payment state
        // keep language and type? Or reset type? Let's keep type for UX
        localStorage.removeItem('assessment_session');
    };

    const startAssessment = () => setIsStarted(true);

    const finishAssessment = () => {
        generateResults(answers);
    };

    const nextStep = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const setAnswer = (itemId: string, value: number) => {
        setAnswers(prev => ({ ...prev, [itemId]: value }));
    };

    const fillRandomAnswers = () => {
        const newAnswers: UserAnswers = {};
        items.forEach(item => {
            newAnswers[item.id] = Math.floor(Math.random() * 5) + 1;
        });
        setAnswers(newAnswers);
        setCurrentStep(totalSteps - 1); // Jump to last step so user can finish immediately
    };

    return (
        <AssessmentContext.Provider value={{
            currentStep,
            totalSteps,
            answers,
            handleAnswer,
            setAnswer,
            nextStep,
            prevStep,
            results,
            isGenerating,
            language,
            setLanguage,
            fillRandomAnswers,
            finishAssessment,
            resetAssessment,
            isComplete: !!results,
            currentCareer,
            setCurrentCareer,
            assessmentType,
            setAssessmentType,
            setResults,
            userDetails,
            setUserDetails,
            isStarted,
            startAssessment,
            hasPaid,
            setHasPaid,
            unlockReport: () => setHasPaid(true)
        }}>
            {children}
        </AssessmentContext.Provider>
    );
};

export const useAssessment = () => {
    const context = useContext(AssessmentContext);
    if (!context) {
        throw new Error('useAssessment must be used within an AssessmentProvider');
    }
    return context;
};
