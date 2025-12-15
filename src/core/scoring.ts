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
    console.log("DEBUG: Answers passed to Check Consistency:", JSON.stringify(answers));
    const consistencyFlags = checkConsistency(answers);

    // --- LOGIC OVERHAUL V2: VETO LOGIC & FACET SPLITTING ---
    // Calculate Special Trait Sums (Raw Answers)
    // Impulsivity: Q60 (Rash decisions, keyed -1, so 5=Impulsive) + Q30 (Jump in, keyed -1)
    // Note: 'keyed: -1' means the "Good" score is low. But here we want the RAW intensity of the bad trait.
    // If user answered 5 (Strongly Agree) to "Make rash decisions", that IS High Impulsivity.
    // So we just take the raw answer.
    const impulsivityRaw = (answers['60'] || 3) + (answers['30'] || 3);

    // Manipulation: Q9 (Use others) OR Q39 (Cheat) OR Q24 (Better than others - Arrogance)
    const rawUseOthers = answers['9'] || 3;
    const rawCheat = answers['39'] || 3;
    const rawArrogance = answers['24'] || 3; // "Believe I am better than others"

    // Art Hate
    const artDislikeRaw = answers['98'] || 3;

    // Empathy Deficit
    const empathyDeficitRaw = answers['74'] || 3;

    // Defined Thresholds (Summit of 2 items max 10, single item max 5)
    // NEW LOGIC: Single Item Veto. If you admit to "Using Others" (4) or "Arrogance" (4), you are flagged.
    const riskFlags = {
        highImpulsivity: impulsivityRaw >= 8,
        highManipulation: (rawUseOthers >= 4) || (rawCheat >= 4) || (rawArrogance >= 4),
        artHater: artDislikeRaw >= 4,
        empathyDeficit: empathyDeficitRaw >= 4
    };

    // Apply Veto Caps

    // VETO 1: The "Dark Triad" Check
    // If High Manipulation/Arrogance detected, we must destroy the "Saint" profile.
    if (riskFlags.highManipulation) {
        // 1. Cap Domain Score
        if (domainResults['A'].percentile > 50) {
            domainResults['A'].level = 'Average'; // Demote from High
            domainResults['A'].percentile = 45;   // Push slightly below neutral to hint at issues
        }

        // 2. FORCE Low Scores on Specific Facets (The "Hypocrisy Check")
        // Facet A2 = Morality/Straight-forwardness
        // Facet A5 = Modesty
        // If they admitted to being manipulative (Q9) or arrogant (Q24), they CANNOT be High Morality or Modesty.

        if (facetResults['A2']) {
            facetResults['A2'].level = 'Low';
            facetResults['A2'].percentile = 25;
            facetResults['A2'].zScore = -1.0;
        }
        if (facetResults['A5']) {
            facetResults['A5'].level = 'Low';
            facetResults['A5'].percentile = 25;
            facetResults['A5'].zScore = -1.0;
        }
    }

    // VETO 2: The "Maverick" Check
    // If High Impulsivity, Cap Conscientiousness (C) at 'Average'
    if (riskFlags.highImpulsivity && domainResults['C'].percentile > 60) {
        domainResults['C'].level = 'Average';
        domainResults['C'].percentile = 50;
    }

    return { domainResults, facetResults, nuancedInsights, consistencyFlags, riasec, riskFlags };
};
