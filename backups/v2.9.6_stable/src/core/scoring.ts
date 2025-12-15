import type { Item, Norms, UserAnswers, ScoreResult } from '../types';
// Actually Domain is a string union type, so it is a type.
// But wait, if I use it in `Record<Domain, ...>` it is used as a type.
// If I use it in `const d: Domain = 'N'`, it is a type.
// So `import type` is correct.

export const calculateRawScores = (answers: UserAnswers, items: Item[]) => {
    const domainScores: Record<string, number> = {}; // Keeping string to avoid strict key checks if Domain is not exhaustive in initialization
    const facetScores: Record<string, number> = {};

    items.forEach((item) => {
        const answer = answers[item.id] || 3; // Default to neutral if missing
        // Reverse coding logic: if keyed is -1, score is 6 - answer
        const score = item.keyed === 1 ? answer : 6 - answer;

        // Aggregate Domain Score
        domainScores[item.domain] = (domainScores[item.domain] || 0) + score;

        // Aggregate Facet Score (e.g., "N1")
        const facetKey = `${item.domain}${item.facet}`;
        facetScores[facetKey] = (facetScores[facetKey] || 0) + score;
    });

    return { domainScores, facetScores };
};

export const calculateZScore = (raw: number, mean: number, sd: number): number => {
    if (sd === 0) return 0;
    return (raw - mean) / sd;
};

// Approximate CDF for Normal Distribution to get percentile
export const calculatePercentile = (z: number): number => {
    // Error function approximation
    const erf = (x: number) => {
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;

        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    };

    return Math.round((0.5 * (1 + erf(z / Math.sqrt(2)))) * 100);
};

export const getLevel = (percentile: number): 'Low' | 'Average' | 'High' => {
    if (percentile < 30) return 'Low';
    if (percentile > 70) return 'High';
    return 'Average';
};

import { generateNuancedInsights, checkConsistency } from './analysis';
import { calculateRiasecScores } from './riasec';

export const generateReport = (answers: UserAnswers, items: Item[], norms: Norms) => {
    const { domainScores, facetScores } = calculateRawScores(answers, items);

    const processScore = (key: string, raw: number): ScoreResult => {
        const norm = norms[key] || { mean: 0, sd: 1 }; // Fallback
        const zScore = calculateZScore(raw, norm.mean, norm.sd);
        const percentile = calculatePercentile(zScore);
        const level = getLevel(percentile);
        return { raw, zScore, percentile, level };
    };

    const domainResults: Record<string, ScoreResult> = {};
    Object.keys(domainScores).forEach(key => {
        domainResults[key] = processScore(key, domainScores[key]);
    });

    const facetResults: Record<string, ScoreResult> = {};
    Object.keys(facetScores).forEach(key => {
        facetResults[key] = processScore(key, facetScores[key]);
    });

    // Generate Nuanced Text
    const nuancedInsights = generateNuancedInsights(domainResults as any, facetResults);

    // Calculate RIASEC Logic
    const riasec = calculateRiasecScores(domainResults as any);

    // Check Consistency
    const consistencyFlags = checkConsistency(answers);

    return { domainResults, facetResults, nuancedInsights, consistencyFlags, riasec };
};
