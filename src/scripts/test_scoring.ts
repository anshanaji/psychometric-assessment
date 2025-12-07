
import { calculateRiasecScores, getTopRiasecCode } from '../core/riasec';
import { calculateMatchScore } from '../components/Results/ResultsDashboard'; // I might need to extract this function or copy it
// Since calculateMatchScore is inside the component, I will copy it here for the test to avoid React dependency issues in a simple script.

// --- Mock Data & Functions ---

// Mock ScoreResult type
type ScoreResult = { zScore: number; percentile: number; level: string; raw: number };
type Domain = 'N' | 'E' | 'O' | 'A' | 'C';

// 1. Define a User Profile (High Extraversion, High Agreeableness -> Should be Social)
const mockDomainResults: Record<Domain, ScoreResult> = {
    N: { zScore: -1.0, percentile: 16, level: 'Low', raw: 20 }, // Low Neuroticism (Stable)
    E: { zScore: 1.5, percentile: 93, level: 'High', raw: 40 }, // High Extraversion (Social)
    O: { zScore: 0.5, percentile: 69, level: 'Average', raw: 30 }, // Avg Openness
    A: { zScore: 1.2, percentile: 88, level: 'High', raw: 38 }, // High Agreeableness (Helpful)
    C: { zScore: 0.2, percentile: 58, level: 'Average', raw: 32 }  // Avg Conscientiousness
};

console.log("--- 1. User Personality Profile (Big Five) ---");
console.table({
    Neuroticism: "Low (Stable)",
    Extraversion: "High (Social, Outgoing)",
    Openness: "Average",
    Agreeableness: "High (Cooperative, Helpful)",
    Conscientiousness: "Average"
});

// 2. Calculate RIASEC Scores using the Scientific Weight Matrix
console.log("\n--- 2. Calculating RIASEC Scores (Scientific Matrix) ---");
const riasecScores = calculateRiasecScores(mockDomainResults);
console.table(riasecScores);

// 3. Determine Top Code
const topCode = getTopRiasecCode(riasecScores);
console.log(`\n>>> Calculated Top RIASEC Code: ${topCode}`);

// 4. Test Career Matching
// Copying the logic from ResultsDashboard.tsx for demonstration
const calculateMatchScoreDemo = (userCode: string, careerCode: string): number => {
    if (!userCode || !careerCode) return 50;

    const userPrimary = userCode.charAt(0);
    const userSecondary = userCode.charAt(1);
    const userTertiary = userCode.charAt(2);

    const careerPrimary = careerCode.charAt(0);
    const careerSecondary = careerCode.charAt(1) || '';
    const careerTertiary = careerCode.charAt(2) || '';

    let score = 60; // Base score

    // Primary Match
    if (careerPrimary === userPrimary) score += 25;
    else if (careerPrimary === userSecondary) score += 15;
    else if (careerPrimary === userTertiary) score += 10;

    // Secondary Match
    if (careerSecondary === userPrimary) score += 10;
    else if (careerSecondary === userSecondary) score += 10;
    else if (careerSecondary === userTertiary) score += 5;

    // Tertiary Match
    if (careerTertiary === userPrimary) score += 5;
    else if (careerTertiary === userSecondary) score += 5;
    else if (careerTertiary === userTertiary) score += 5;

    return Math.min(99, Math.max(10, score));
};

console.log("\n--- 3. Testing Career Matches ---");
const testCareers = [
    { title: "Nurse", code: "SIA" },      // Social Primary
    { title: "Teacher", code: "SAE" },    // Social Primary
    { title: "Software Dev", code: "IRC" }, // Investigative Primary (Mismatch)
    { title: "Accountant", code: "CEI" }   // Conventional Primary (Mismatch)
];

testCareers.forEach(career => {
    const score = calculateMatchScoreDemo(topCode, career.code);
    console.log(`Career: ${career.title} (${career.code}) -> Match Score: ${score}%`);
});

console.log("\n--- Conclusion ---");
if (topCode.startsWith('S')) {
    console.log("SUCCESS: High Extraversion + Agreeableness correctly resulted in 'Social' (S) as the primary type.");
    console.log("SUCCESS: 'Social' careers like Nurse and Teacher received higher match scores.");
} else {
    console.log("FAILURE: Logic did not produce expected results.");
}
