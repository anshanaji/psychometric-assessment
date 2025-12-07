
import { checkConsistency, generateNuancedInsights } from '../core/analysis';
import type { ScoreResult } from '../types';

// Mock Data Builders
const mockScore = (level: 'Low' | 'Average' | 'High', percentile: number): ScoreResult => ({
    raw: 0, zScore: 0, percentile, level
});

const runTests = () => {
    console.log("--- Running Analysis Verification ---");

    // 1. Test Inconsistency: "Leader of Mess"
    console.log("\n1. Testing Inconsistency Check...");
    const answers1 = {
        "70": 1, // "Leave a mess" -> Strongly Disagree (Claim Tidy)
        "100": 5 // "Leave belongings around" -> Strongly Agree (Claim Messy)
    };
    const flags1 = checkConsistency(answers1);
    console.log("Flags found (Expected 1):", flags1.length);
    if (flags1.length > 0) console.log("Message:", flags1[0].message);

    // 2. Test Nuanced Insight: "The Social Non-Leader"
    console.log("\n2. Testing Nuanced Extraversion...");
    const domainRes = {
        'N': mockScore('Average', 50),
        'E': mockScore('High', 80), // High Extraversion
        'O': mockScore('Average', 50),
        'A': mockScore('Average', 50),
        'C': mockScore('Average', 50),
    };
    const facetRes = {
        'E3': mockScore('Low', 30), // Low Assertiveness
        'E5': mockScore('High', 90), // High Excitement
    };
    // @ts-ignore
    const insights = generateNuancedInsights(domainRes, facetRes);
    console.log("Generated E Text:", insights['E']);

    // 3. Test Nuanced Insight: "The Procrastinator"
    console.log("\n3. Testing Nuanced Conscientiousness...");
    const domainResC = { ...domainRes, 'C': mockScore('Average', 55) };
    const facetResC = {
        'C2': mockScore('High', 75), // High Orderliness
        'C5': mockScore('Low', 25), // Low Self-Discipline
    };
    // @ts-ignore
    const insightsC = generateNuancedInsights(domainResC, facetResC);
    console.log("Generated C Text:", insightsC['C']);
};

runTests();
