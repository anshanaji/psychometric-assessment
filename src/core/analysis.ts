import type { Domain, UserAnswers, ScoreResult } from '../types';
import bigFiveInsights from '../data/big_five_insights.json';

// --- Text Generation Types ---
export interface ConsistencyFlag {
    item1Id: string;
    item2Id: string;
    message: string;
    title?: string;
    severity: 'Medium' | 'High';
}

// --- Inconsistency Map ---
// Pairs of items that *should* have similar answers (or opposite if keyed differently)
// But here we rely on the user answers passed as 1-5 values.
// We need to know the specific IDs and expected relationship.
// Based on user request examples:
const consistencyChecks = [
    // 1. The "Altruistic Strategist" (Hypocrisy Check)
    // Help Others (Q14) vs Use Others (Q9)
    // Contradiction: High Help (4/5) AND High Use (4/5)
    {
        idA: "14", // Love to help others
        idB: "9",  // Use others for my own ends
        condition: (a: number, b: number) => (a >= 4 && b >= 4),
        message: "You express a strong desire to **help others**, yet you also admit to **using people for your own ends**. This suggests you may view relationships as transactional—helping others primarily when it builds your own status.",
        title: "The Altruistic Strategist"
    },
    // 2. The "Social Paradox" (Reactive Social Skills)
    // Make Friends (Q2) vs Hard to Approach (Q16)
    // Contradiction: High Friends (4/5) AND High Difficulty Approaching (4/5)
    {
        idA: "2",  // Make friends easily
        idB: "16", // Find it difficult to approach others
        condition: (a: number, b: number) => (a >= 4 && b >= 4),
        message: "You feel you **make friends easily**, yet you also find it **hard to approach people**. This suggests 'Reactive Social Skills'—you are warm and engaging *once* a conversation starts, but you struggle to break the ice yourself.",
        title: "The Social Paradox"
    },
    // 3. The "Ego Conflict" (Defensive Confidence)
    // Better than others (Q24) vs Dislike myself (Q41)
    // Contradiction: High Arrogance (4/5) AND High Self-Dislike (3/4/5 - any non-disagreement)
    {
        idA: "24", // Believe I am better than others
        idB: "41", // Dislike myself
        condition: (a: number, b: number) => (a >= 4 && b >= 3),
        message: "You admitted to feeling **better than others**, but also indicated you **do not like yourself**. This often signals 'Defensive Confidence'—projecting superiority to protect a fragile sense of self-esteem.",
        title: "The Ego Conflict"
    },
    // 4. The "Impulsive Achiever" (Speed vs Precision)
    // Excel (Q35) vs Rash Decisions (Q60)
    // Contradiction: High Excel (4/5) AND High Rashness (4/5)
    {
        idA: "35", // Excel in what I do
        idB: "60", // Make rash decisions
        condition: (a: number, b: number) => (a >= 4 && b >= 4),
        message: "You rate your ability to **excel** highly, but also admit to making **rash decisions**. You have a high-performance engine but weak brakes. You move fast and break things, which can be a strength in entrepreneurship but a risk in operations.",
        title: "The Impulsive Achiever"
    }
];

export const checkConsistency = (answers: UserAnswers): ConsistencyFlag[] => {
    const flags: ConsistencyFlag[] = [];

    consistencyChecks.forEach(check => {
        const valA = answers[check.idA];
        const valB = answers[check.idB];

        // DEBUG LOGGING
        if (check.idA === '14' && check.idB === '9') {
            console.log(`DEBUG: Checking Altruism (14 vs 9). Val 14: ${valA}, Val 9: ${valB}. Condition Met: ${check.condition(valA, valB)}`);
        }

        if (valA !== undefined && valB !== undefined) {
            if (check.condition(valA, valB)) {
                flags.push({
                    item1Id: check.idA,
                    item2Id: check.idB,
                    message: check.message,
                    title: (check as any).title, // Type assertion for now until interface update
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
