import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateAIAnalysis = async (results: any, userDetails: any, language: string = 'en') => {
    if (!API_KEY) {
        throw new Error("Gemini API Key is missing");
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    // Extract Risk Flags
    const riskFlags = results.riskFlags || {};
    const hasRisks = Object.values(riskFlags).some(v => v);

    const prompt = `
    Act as a "No-BS" Elite Executive Coach.
    I will provide assessment results for a user.
    
    User Profile:
    Name: ${userDetails?.name || 'User'}
    Age: ${userDetails?.age || 'Unknown'}
    Current Role/Profession: ${userDetails?.profession || 'Unknown'}
    
    Language: ${language === 'ml' ? 'Malayalam' : 'English'}
    
    Results:
    ${JSON.stringify(results, null, 2)}

    ${hasRisks ? `
    CRITICAL CONFLICT ALERTS (YOU MUST ADDRESS THESE):
    ${riskFlags.highImpulsivity ? '- HIGH DRIVE / LOW CONTROL: User has drive but admits to "Rash Decisions". Label as "Maverick / Firefighter". Do NOT call them "Steady".' : ''}
    ${riskFlags.highManipulation ? '- STRATEGIC MASK: User appears Agreeable but admits to "Using Others". Label as "Politically Savvy / Transactional". Do NOT call them "Altruistic".' : ''}
    ${riskFlags.artHater ? '- PRAGMATIST: User hates Art/Abstraction. Focus on Concrete ROI. Do NOT suggest creative fluff.' : ''}
    ${riskFlags.empathyDeficit ? '- COLD RATIONALITY: User lacks empathy. Focus on Logic/Efficiency. Do NOT appeal to "Helping Others".' : ''}
    
    INSTRUCTION: The user has contradictory traits. Do NOT smooth this over. Highlight the TENSION between their skills and their risks.
    ` : ''}
    
    Your Task:
    Provide a BRUTALLY HONEST, high-impact analysis of their personality.
    Do NOT use fluff. Do NOT be overly polite. Get straight to the point.
    ${hasRisks ? 'Since risks are detected, the "Harsh Reality" section MUST focus on them.' : ''}
    
    Structure Required:
    ## 1. The Raw Truth
    (3 sentences max. What is their fundamental nature? ${hasRisks ? 'Mention the specific conflict detected.' : ''})

    ## 2. Your Unfair Advantages
    * **[Strength 1]**: (Why it matters)
    * **[Strength 2]**: (Why it matters)
    * **[Strength 3]**: (Why it matters)

    ## 3. The Harsh Reality (Growth Areas)
    (Be critical. What will hold them back in their role as a ${userDetails?.profession}? 2 bullet points max.)

    ## 4. Immediate Action Plan
    (One specific, high-leverage thing they must do to improve in their current role.)

    ## 5. Survival Strategy: Leveraging Strengths in Current Role
    (Tactical advice on how to use their specific strengths to not just survive but dominate in their current profession of ${userDetails?.profession}. Be specific.)

    Constraints:
    - Maximum 300 words.
    - Use Markdown formatting strictly.
    - No "Introduction" or "Conclusion" paragraphs. Start directly with the headers.
    `;

    const MODELS_TO_TRY = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-pro",
        "gemini-1.5-pro-001",
        "gemini-pro",
        "gemini-1.0-pro"
    ];
    let lastError;

    // 1. Try hardcoded models first
    for (const modelName of MODELS_TO_TRY) {
        try {
            console.log(`Attempting generation with: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error: any) {
            console.warn(`Model ${modelName} failed:`, error.message);
            // Save the detailed error for the final throw if needed
            const errorMessage = error?.response?.data?.error?.message || error?.message || JSON.stringify(error);
            lastError = new Error(`Gemini Error (${modelName}): ${errorMessage}`);
        }
    }

    // 2. If all hardcoded models fail, try to discover one dynamically
    try {
        console.log("Hardcoded models failed. Attempting dynamic auto-discovery...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);

        if (response.ok) {
            const data = await response.json();
            const models = data.models || [];

            // Find a model that supports generateContent and is a gemini model
            const validModel = models.find((m: any) =>
                m.supportedGenerationMethods?.includes("generateContent") &&
                m.name.includes("gemini")
            );

            if (validModel) {
                // The name comes back as 'models/gemini-pro', we usually strip 'models/' for the SDK
                // but let's try both if needed. The SDK usually handles it.
                const cleanName = validModel.name.replace("models/", "");
                console.log(`Discovered valid model: ${cleanName} (from ${validModel.name}). Retrying...`);

                const model = genAI.getGenerativeModel({ model: cleanName });
                const result = await model.generateContent(prompt);
                return result.response.text();
            } else {
                console.warn("No 'gemini' model with 'generateContent' capability found in the list.");
                lastError = new Error("Auto-discovery found no compatible models. Check your API Key permissions.");
            }
        } else {
            console.warn(`Model discovery failed with status: ${response.status}`);
            lastError = new Error(`Auto-discovery failed (Status ${response.status}). Check API Key.`);
        }
    } catch (discoveryError: any) {
        console.warn("Dynamic discovery failed:", discoveryError);
        lastError = new Error(`Auto-discovery Network Error: ${discoveryError.message || discoveryError}`);
    }

    // If we get here, all models failed
    console.error("All Gemini models failed.");
    throw lastError;
};
