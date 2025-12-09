import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Fallback list if auto-discovery fails
const FALLBACK_MODELS = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];

async function getValidModelName(): Promise<string> {
    try {
        console.log("Discovering available Gemini models...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);

        if (!response.ok) {
            throw new Error(`Failed to list models: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const models = data.models || [];

        // Find the first model that supports 'generateContent' and is a 'gemini' model
        const validModel = models.find((m: any) =>
            m.name.includes("gemini") &&
            m.supportedGenerationMethods?.includes("generateContent")
        );

        if (validModel) {
            // The name comes back as 'models/gemini-pro', we need just 'gemini-pro' usually, 
            // but the SDK accepts the full name too. Let's strip the prefix to be safe.
            const cleanName = validModel.name.replace("models/", "");
            console.log(`Found valid model: ${cleanName}`);
            return cleanName;
        }
    } catch (e) {
        console.warn("Model discovery failed, using fallback list.", e);
    }
    return "gemini-pro"; // Ultimate fallback
}

export const generateAIAnalysis = async (results: any, userDetails: any, language: string = 'en') => {
    if (!API_KEY) {
        throw new Error("Gemini API Key is missing");
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    // 1. Try to find a valid model dynamically
    let modelName = await getValidModelName();
    let modelsToTry = [modelName, ...FALLBACK_MODELS];

    // Remove duplicates
    modelsToTry = [...new Set(modelsToTry)];

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
    
    Your Task:
    Provide a BRUTALLY HONEST, high-impact analysis of their personality.
    Do NOT use fluff. Do NOT be overly polite. Get straight to the point.
    
    Structure Required:
    ## 1. The Raw Truth
    (3 sentences max. What is their fundamental nature?)

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

    let lastError;

    for (const m of modelsToTry) {
        try {
            console.log(`Attempting generation with: ${m}`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error: any) {
            console.warn(`Model ${m} failed:`, error.message);
            lastError = error;
        }
    }

    throw lastError || new Error("All models failed.");
};
