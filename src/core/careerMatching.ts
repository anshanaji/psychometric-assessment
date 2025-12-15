import type { Career, RiskFlags } from '../types';

export const calculateMatchScore = (userData: Record<string, number> | string, jobCode: string, _title?: string): number => {
    if (!userData || !jobCode) return 0;

    // LEGACY STRING MATCHING (For MBTI or limited data)
    if (typeof userData === 'string') {
        const u = userData.toUpperCase();
        const j = jobCode.toUpperCase();
        let score = 0;
        if (u[0] === j[0]) score += 50;
        if (u[1] === j[0] || u[0] === j[1]) score += 25;
        if (u.includes(j[0])) score += 10;
        if (u.slice(0, 2) === j.slice(0, 2)) score += 15;
        return Math.min(100, score);
    }

    // ACCURATE SCORE MATCHING
    const userScores = userData;
    const j = jobCode.toUpperCase();

    // Weights for Primary, Secondary, Tertiary traits of the JOB
    const weights = [3, 2, 1];
    let totalScore = 0;
    let totalWeight = 0;

    for (let i = 0; i < Math.min(j.length, 3); i++) {
        const trait = j[i];
        const weight = weights[i];

        // Get user's score for this trait (0-100)
        // If trait is missing in userScores (shouldn't happen for valid RIASEC), treat as 0
        const userTraitScore = userScores[trait] || 0;

        totalScore += userTraitScore * weight;
        totalWeight += weight;
    }

    // Normalize to 0-100
    // If job has fewer than 3 letters, totalWeight handles it.
    // e.g. Job "R" -> Weight 3. Score = (User[R]*3)/3 = User[R]. Correct.
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
};

// Renamed to force refresh
export const filterCareersV2 = (careers: Career[], riskFlags?: RiskFlags, _currentCareerTitle?: string): Career[] => {
    let filtered = [...careers];

    // Filter 0; User requested NO blacklist. We rely on Weighted Scoring now.
    // However, if we strongly mismatch, they will fall to the bottom.

    if (!riskFlags) return filtered;

    // Filter 1: Art Hater
    if (riskFlags.artHater) {
        const artKeywords = ['Architect', 'Designer', 'Illustrator', 'Artist', 'Musician', 'Actor', 'Writer', 'Editor', 'Photographer'];
        filtered = filtered.filter(c => !artKeywords.some(k => c.title.includes(k)));
    }

    // Filter 2: Empathy Deficit / Dark Triad
    if (riskFlags.empathyDeficit || riskFlags.highManipulation) {
        const careKeywords = ['Nurse', 'Social Worker', 'Therapist', 'Counselor', 'Teacher', 'Psychologist', 'Care', 'Health', 'Doctor', 'Pediatrician'];
        filtered = filtered.filter(c => !careKeywords.some(k => c.title.includes(k)));
    }

    return filtered;
};

export interface RankedCareers {
    top25: (Career & { matchScore: number })[];
    bottom25: (Career & { matchScore: number })[];
}

// V2 RANKING FUNCTION
export const getRankedCareersV2 = (
    allCareers: Career[],
    userData: Record<string, number> | string,
    riskFlags?: RiskFlags,
    currentCareerTitle?: string
): RankedCareers => {

    // 1. Filter (Risk Flags only)
    const filteredList = filterCareersV2(allCareers, riskFlags, currentCareerTitle);

    // 2. Find Current Career Code
    let currentCareerCode: string | null = null;
    if (currentCareerTitle) {
        // Exact or Fuzzy match
        const found = allCareers.find(c => c.title.toLowerCase() === currentCareerTitle.toLowerCase());
        if (found) {
            currentCareerCode = found.code;
        } else {
            // Try 'includes' fallback if no exact match
            const partial = allCareers.find(c => c.title.toLowerCase().includes(currentCareerTitle.toLowerCase()));
            if (partial) currentCareerCode = partial.code;
        }
    }

    // 3. Score & Sort
    const scored = filteredList.map(career => {
        // Base Score: Personality Match (0-100)
        const personalityScore = calculateMatchScore(userData, career.code, career.title);

        // Alignment Score: Current Career Match (0-100)
        let alignmentScore = 0;
        if (currentCareerCode) {
            // Compare job.code (e.g. ICR) vs current.code (e.g. IRC)
            // Same Primary? +50
            if (career.code[0] === currentCareerCode[0]) alignmentScore += 50;
            // Same Secondary? +30
            if (career.code[1] === currentCareerCode[1]) alignmentScore += 30;
            // Same Tertiary? +20
            if (career.code[2] === currentCareerCode[2]) alignmentScore += 20;

            // Extra boost if letter is present anywhere
            if (currentCareerCode.includes(career.code[0])) alignmentScore += 10;
        } else {
            // If no current career, Alignment is neutral/unused.
            // We can just set it to personalityScore effectively (or 0 and ignore weight).
            alignmentScore = personalityScore;
        }

        // WEIGHTED BLEND
        // User wants "matches with chosen career".
        // Let's give significant weight to alignment if it exists.
        // Mix: 60% Personality, 40% Career Alignment
        let finalScore = personalityScore;
        if (currentCareerCode) {
            finalScore = (personalityScore * 0.6) + (alignmentScore * 0.4);
        }

        return {
            ...career,
            matchScore: Math.round(finalScore)
        };
    }).sort((a, b) => b.matchScore - a.matchScore);

    // 4. Split
    const top25 = scored.slice(0, 25);
    // Bottom 25
    const bottom25 = scored.slice(-25).sort((a, b) => a.matchScore - b.matchScore);

    return { top25, bottom25 };
};
