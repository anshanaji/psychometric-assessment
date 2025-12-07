import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { Item, UserAnswers, AssessmentResult } from '../types';
import itemsData from '../data/items.json';
import normsData from '../data/norms.json';
import careersData from '../data/careers.json';
import { generateReport } from '../core/scoring';
import { calculateRiasecScores, getTopRiasecCode } from '../core/riasec';

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
    fillRandomAnswers: () => void;
    finishAssessment: () => void;
    resetAssessment: () => void;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<UserAnswers>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<AssessmentResult | null>(null);
    const [language, setLanguage] = useState<'en' | 'ml'>('en');

    const items = itemsData as Item[];
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
            } catch (e) {
                console.error("Failed to load session", e);
                localStorage.removeItem('assessment_session');
            }
        }
    }, []);

    // Save state to localStorage on change
    useEffect(() => {
        localStorage.setItem('assessment_session', JSON.stringify({ answers, currentStep, language, results }));
    }, [answers, currentStep, language, results]);

    const generateResults = (finalAnswers: UserAnswers) => {
        setIsGenerating(true);
        setTimeout(() => {
            // @ts-ignore
            const { domainResults, facetResults, nuancedInsights, consistencyFlags } = generateReport(finalAnswers, items, normsData);
            const riasecScores = calculateRiasecScores(domainResults);
            const topRiasec = getTopRiasecCode(riasecScores);

            // Career Lookup Logic
            let matchedCareers = (careersData as any)[topRiasec] || [];

            // Fallback strategy if exact match yields nothing
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
                consistencyFlags: consistencyFlags || []
            };

            // NOTE: generateReport in scoring.ts was updated to return nuancedInsights and consistencyFlags.
            // I should update the destructuring above to capture them.

            setResults(resultData);
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
        // localStorage will auto-update due to useEffects, or we might need to clear it manually?
        // We use localStorage for persistence.
        localStorage.removeItem('assessment_answers');
        localStorage.removeItem('assessment_step');
        localStorage.removeItem('assessment_results');
    };

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
        // We don't advance step here since we might want to manually submit or verify
    };

    return (
        <AssessmentContext.Provider value={{
            currentStep,
            totalSteps,
            answers,
            handleAnswer,
            setAnswer, // Added back
            nextStep,
            prevStep,
            results,
            isGenerating,
            language,
            setLanguage,
            fillRandomAnswers, // Added back
            finishAssessment, // Added back
            resetAssessment // Added back
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
