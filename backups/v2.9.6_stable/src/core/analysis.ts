import type { Domain, UserAnswers, ScoreResult } from '../types';
import bigFiveInsights from '../data/big_five_insights.json';

// --- Text Generation Types ---
export interface ConsistencyFlag {
    item1Id: string;
    item2Id: string;
    message: string;
    severity: 'Medium' | 'High';
}

// --- Inconsistency Map ---
// Pairs of items that *should* have similar answers (or opposite if keyed differently)
// But here we rely on the user answers passed as 1-5 values.
// We need to know the specific IDs and expected relationship.
// Based on user request examples:
const consistencyChecks = [
    {
        // "Leave a mess in my room" (ID 70, keyed -1) vs "Leave my belongings around" (ID 100, keyed -1)
        // Actually, let's look at the content.
        // ID 70: "Leave a mess in my room" (Keyed -1 for Conscientiousness Orderliness)
        // If user says Strongly Disagree (1) -> They DO NOT leave a mess -> High Orderliness behavior.
        // ID 100: "Leave my belongings around" (Keyed -1)
        // If user says Strongly Agree (5) -> They DO leave belongings -> Low Orderliness behavior.
        // Contradiction: (1 on "Leave mess") AND (5 on "Leave belongings").
        idA: "70",
        idB: "100",
        condition: (a: number, b: number) => (a <= 2 && b >= 4) || (a >= 4 && b <= 2),
        message: "You indicated being very tidy ('Leave a mess': Disagree) but also admitted to leaving belongings around ('Leave belongings': Agree)."
    },
    {
        // "Like to tidy up" (ID 10, Keyed 1) vs "Leave a mess in my room" (ID 70, Keyed -1)
        // ID 10: High means Tidy.
        // ID 70: High means Messy (User agrees they leave a mess).
        // Contradiction: High on 10 (Love to tidy) AND High on 70 (Leave a mess).
        idA: "10",
        idB: "70",
        condition: (a: number, b: number) => (a >= 4 && b >= 4),
        message: "You reported loving to tidy up, but also agreed that you often leave a mess in your room."
    },
    {
        // "Get angry easily" (ID 6, Keyed 1) vs "Rarely get irritated" (ID 96, Keyed -1)
        // ID 6: High = Angry.
        // ID 96: High = Not Irritated (User agrees they rarely get irritated).
        // Contradiction: High on 6 (Angry) AND High on 96 (Rarely irritated).
        idA: "6",
        idB: "96",
        condition: (a: number, b: number) => (a >= 4 && b >= 4),
        message: "You mentioned getting angry easily, but elsewhere stated you rarely get irritated."
    }
];


export const checkConsistency = (answers: UserAnswers): ConsistencyFlag[] => {
    const flags: ConsistencyFlag[] = [];

    consistencyChecks.forEach(check => {
        const valA = answers[check.idA];
        const valB = answers[check.idB];

        if (valA !== undefined && valB !== undefined) {
            if (check.condition(valA, valB)) {
                flags.push({
                    item1Id: check.idA,
                    item2Id: check.idB,
                    message: check.message,
                    severity: 'High'
                });
            }
        }
    });

    return flags;
};

// --- Facet-Based Insight Generation ---

export const generateNuancedInsights = (
    domainResults: Record<Domain, ScoreResult>,
    facetResults: Record<string, ScoreResult>
): Record<Domain, string> => {
    const insights: Record<Domain, string> = {} as any;

    // 1. Extraversion Logic
    // Differentiate Assertiveness (E3) vs Excitement-Seeking (E5) / Friendliness (E1)
    const eScore = domainResults['E'];
    const e_assertiveness = facetResults['E3']?.percentile || 50;
    const e_excitement = facetResults['E5']?.percentile || 50;
    const e_level = eScore.level;

    let eText = (bigFiveInsights as any)['E'][e_level.toLowerCase()]; // Default

    if (e_level === 'High') {
        if (e_excitement > 70 && e_assertiveness < 40) {
            eText = "You are a high-energy individual who loves excitement and social buzz. However, unlike the typical 'Leader' profile, you prefer to enjoy the moment rather than take charge or direct others. You bring life to the party but are happy to let others steer the ship.";
        } else if (e_assertiveness > 70 && e_excitement < 40) {
            eText = "You are a natural leader who is comfortable taking charge and directing others. However, you are more serious and focused on goals than on seeking thrills or wild parties. Your extraversion manifests as dominance rather than sociability.";
        }
    }
    insights['E'] = eText;


    // 2. Conscientiousness Logic
    // Differentiate Orderliness (C2) vs Self-Discipline (C5) / Cautiousness (C6)
    const cScore = domainResults['C'];
    const c_order = facetResults['C2']?.percentile || 50;
    const c_discipline = facetResults['C5']?.percentile || 50;
    const c_deliberation = facetResults['C6']?.percentile || 50; // Cautiousness
    const c_level = cScore.level;

    let cText = (bigFiveInsights as any)['C'][c_level.toLowerCase()];

    // "The Procrastinator" Pattern: High Orderliness (likes clean space) but Low Discipline (wastes time)
    if (c_order > 60 && c_discipline < 40) {
        cText = "You appreciate a tidy and structured environment, but you often struggle with self-discipline and procrastination. You likely have good intentions and plans, but find it difficult to execute them consistently without distraction.";
    }
    // "The Impulsive Perfectionist": High Orderliness but Low Cautiousness (Rash decisions)
    else if (c_order > 60 && c_deliberation < 30) {
        cText = "You are organized and neat, but you tend to make rash, impulsive decisions. Your physical space may be in order, but your decision-making process can be hasty, leading to regrets despite your best efforts to be structured.";
    }
    // "The Messy Achiever": Low Orderliness but High Achievement/Discipline
    else if (c_order < 40 && (facetResults['C4']?.percentile || 0) > 70) {
        cText = "You are highly driven and ambitious, getting significant work done. However, you pay little attention to tidiness or organization. You prioritize results over process and may thrive in 'organized chaos'.";
    }

    insights['C'] = cText;


    // 3. Neuroticism Logic
    // Differentiate Volatility (N2 Anger) vs Withdrawal (N1 Anxiety, N3 Depression)
    const nScore = domainResults['N'];
    const n_anger = facetResults['N2']?.percentile || 50;
    const n_anxiety = facetResults['N1']?.percentile || 50;
    const n_vulnerability = facetResults['N6']?.percentile || 50;
    const n_level = nScore.level;

    let nText = (bigFiveInsights as any)['N'][n_level.toLowerCase()];

    // Low Anger but High Anxiety -> "The Silent Worrier"
    if (n_anger < 40 && (n_anxiety > 70 || n_vulnerability > 70)) {
        nText = "You come across as gentle and virtually never get angry at others. However, internally, you may struggle significantly with anxiety, worry, or feelings of being overwhelmed. Your 'calmness' regarding anger masks a high sensitivity to stress.";
    }
    // High Anger but Low Anxiety -> "The Volatile Fighter"
    else if (n_anger > 70 && n_anxiety < 40) {
        nText = "You are generally confident and not prone to worry or fear. However, you have a short fuse and can become irritable or angry quickly. Your stress manifests as outward frustration rather than inward retreat.";
    }

    insights['N'] = nText;

    // 4. Openness (Default fallback for now, maybe refined later)
    insights['O'] = (bigFiveInsights as any)['O'][domainResults['O'].level.toLowerCase()];

    // 5. Agreeableness
    // Differentiate Compassion (A6 Sympathy) vs Politeness (A4 Cooperation)
    const aScore = domainResults['A'];
    const a_sympathy = facetResults['A6']?.percentile || 50;
    const a_cooperation = facetResults['A4']?.percentile || 50; // "Cooperation" often maps to compliance/avoiding conflict

    let aText = (bigFiveInsights as any)['A'][aScore.level.toLowerCase()];

    // "The Tough Helper": High Sympathy (feels for others) but Low Cooperation (argumentative/direct)
    if (a_sympathy > 70 && a_cooperation < 30) {
        aText = "You care deeply about others and feel their pain, but you are not one to back down from a fight. You are an advocate who will argue fiercely for what you believe is right, rather than a passive peacemaker.";
    }

    insights['A'] = aText;

    return insights;
};
