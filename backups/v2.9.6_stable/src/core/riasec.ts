import type { Domain, RiasecType, ScoreResult } from '../types';

// Weight Matrix from implementation plan
const WEIGHTS: Record<RiasecType, Record<Domain, number>> = {
    R: { O: 0.20, C: 0.20, E: 0.10, A: 0.05, N: -0.10 },
    I: { O: 0.50, C: 0.10, E: -0.10, A: -0.05, N: -0.10 },
    A: { O: 0.65, C: -0.15, E: 0.10, A: 0.05, N: 0.15 },
    S: { O: 0.10, C: 0.10, E: 0.60, A: 0.50, N: -0.10 },
    E: { O: 0.10, C: 0.30, E: 0.55, A: -0.10, N: -0.15 },
    C: { O: -0.10, C: 0.60, E: 0.10, A: 0.15, N: -0.10 },
};

export const calculateRiasecScores = (domainResults: Record<Domain, ScoreResult>) => {
    const scores: Record<RiasecType, number> = {
        R: 0, I: 0, A: 0, S: 0, E: 0, C: 0
    };

    (Object.keys(WEIGHTS) as RiasecType[]).forEach(type => {
        let score = 0;
        (Object.keys(WEIGHTS[type]) as Domain[]).forEach(domain => {
            const zScore = domainResults[domain]?.zScore || 0;
            const weight = WEIGHTS[type][domain];
            score += zScore * weight;
        });
        scores[type] = score;
    });

    return scores;
};

export const getTopRiasecCode = (scores: Record<RiasecType, number>): string => {
    return Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type]) => type)
        .join('');
};
