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

// Helper to avoid circular dependency with scoring.ts
const getPercentile = (z: number): number => {
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

        // Normalize: Since weights sum to < 1 (approx 0.5-0.6), the raw sum 'score' is a diluted Z-score.
        // To get a meaningful percentile, we should scale it up slightly or assume it's a Z-score with lower variance?
        // Let's assume the weighted sum *is* the Z-score estimate for the RIASEC type.
        // But since weights sum to ~0.5, a "High" user (Z=2 everywhere) gets score=1.
        // Percentile(1) is ~84%. Percentile(0.5) is ~69%.
        // To get full range, we might want to multiply by 1.5 or 2?
        // Let's try multiplying by 2.0 to restore variance (assuming weights summed to ~0.5).
        // R sum=0.45. I sum=0.35. A sum=0.8. S sum=1.0. E sum=0.7. C sum=0.65.
        // Average weight sum is ~0.65. So multiplying by 1.5 is safer.

        scores[type] = getPercentile(score * 1.5);
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
