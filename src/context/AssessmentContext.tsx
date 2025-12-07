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
    isComplete: boolean;
    currentCareer: string;
    setCurrentCareer: (career: string) => void;
    currentCareerCode: string;
    setCurrentCareerCode: (code: string) => void;
    setAnswer: (itemId: string, value: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    results: AssessmentResult | null;
    resetAssessment: () => void;
    finishAssessment: () => void;
    fillRandomAnswers: () => void;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<UserAnswers>({});
    const [isComplete, setIsComplete] = useState(false);
    const [currentCareer, setCurrentCareer] = useState<string>('');
    const [currentCareerCode, setCurrentCareerCode] = useState<string>('');

    // Load state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('assessment_session');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.answers) setAnswers(parsed.answers);
                if (parsed.currentStep !== undefined) setCurrentStep(parsed.currentStep);
                if (parsed.currentCareer) setCurrentCareer(parsed.currentCareer);
                if (parsed.currentCareerCode) setCurrentCareerCode(parsed.currentCareerCode);
                if (parsed.isComplete !== undefined) setIsComplete(parsed.isComplete);
            } catch (e) {
                console.error("Failed to load session", e);
                localStorage.removeItem('assessment_session');
            }
        }
    }, []);

    // Save state to localStorage on change
    useEffect(() => {
        localStorage.setItem('assessment_session', JSON.stringify({ answers, currentStep, currentCareer, currentCareerCode, isComplete }));
    }, [answers, currentStep, currentCareer, currentCareerCode, isComplete]);

    const items = itemsData as Item[];
    const totalSteps = items.length;

    const setAnswer = (itemId: string, value: number) => {
        setAnswers(prev => ({ ...prev, [itemId]: value }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setIsComplete(true);
            localStorage.removeItem('assessment_session'); // Clear on completion
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const resetAssessment = () => {
        setAnswers({});
        setCurrentStep(0);
        setCurrentCareer('');
        setCurrentCareerCode('');
        setIsComplete(false);
        localStorage.removeItem('assessment_session');
    };

    const finishAssessment = () => {
        setIsComplete(true);
        localStorage.removeItem('assessment_session');
    };

    const fillRandomAnswers = () => {
        const newAnswers: UserAnswers = {};
        items.forEach(item => {
            newAnswers[item.id] = Math.floor(Math.random() * 5) + 1;
        });
        setAnswers(newAnswers);
        // Jump to start of last batch (115 for 120 items with batch size 5)
        setCurrentStep(115);
    };

    const results = useMemo(() => {
        if (!isComplete) return null;

        const { domainResults, facetResults } = generateReport(answers, items, normsData);
        const riasecScores = calculateRiasecScores(domainResults);
        const topRiasec = getTopRiasecCode(riasecScores);

        // Career Lookup Logic
        // 1. Exact Match (3 letters)
        let careers = (careersData as any)[topRiasec] || [];

        // 2. Permutations of top 3 (if no exact match)
        if (careers.length === 0) {
            const perms = [
                topRiasec,
                topRiasec[0] + topRiasec[2] + topRiasec[1], // Swap 2 & 3
                topRiasec[1] + topRiasec[0] + topRiasec[2], // Swap 1 & 2
                topRiasec[1] + topRiasec[2] + topRiasec[0],
                topRiasec[2] + topRiasec[0] + topRiasec[1],
                topRiasec[2] + topRiasec[1] + topRiasec[0]
            ];

            for (const p of perms) {
                if ((careersData as any)[p]) {
                    careers = (careersData as any)[p];
                    break;
                }
            }
        }

        // 3. Match by top 2 letters (if still no match)
        if (careers.length === 0) {
            const twoLetter = topRiasec.substring(0, 2);
            // Find any key that starts with these 2 letters
            const allKeys = Object.keys(careersData);
            for (const key of allKeys) {
                if (key.startsWith(twoLetter)) {
                    careers = [...careers, ...(careersData as any)[key]];
                }
            }
        }

        // 4. Fallback: Match by top 1 letter
        if (careers.length === 0) {
            const oneLetter = topRiasec.substring(0, 1);
            const allKeys = Object.keys(careersData);
            for (const key of allKeys) {
                if (key.startsWith(oneLetter)) {
                    careers = [...careers, ...(careersData as any)[key]];
                }
            }
            // Limit fallback results
            careers = careers.slice(0, 5);
        }

        return {
            domains: domainResults,
            facets: facetResults,
            riasec: riasecScores,
            topRiasec,
            careers
        };
    }, [isComplete, answers]);

    return (
        <AssessmentContext.Provider value={{
            currentStep,
            totalSteps,
            answers,
            isComplete,
            currentCareer,
            setCurrentCareer,
            currentCareerCode,
            setCurrentCareerCode,
            setAnswer,
            nextStep,
            prevStep,
            results,
            resetAssessment,
            finishAssessment,
            fillRandomAnswers
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
