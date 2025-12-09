import type { ScoreResult, Domain } from '../types';

export interface MotivationDriver {
    id: string;
    name: string;
    score: number; // 0-100
    description: string;
}

export interface LearningStyle {
    style: string;
    description: string;
    tips: string[];
}

export interface TraitSynergy {
    name: string;
    traits: string[];
    description: string;
    type: 'strength' | 'challenge';
}

// Helper to get score safely
const getP = (domains: Record<string, ScoreResult>, key: Domain) => domains[key]?.percentile || 50;

export const deriveMotivationDrivers = (domains: Record<string, ScoreResult>, language: string = 'en'): MotivationDriver[] => {
    const O = getP(domains, 'O');
    const C = getP(domains, 'C');
    const E = getP(domains, 'E');
    const A = getP(domains, 'A');
    const N = getP(domains, 'N'); // Low N is Stability

    return [
        {
            id: 'achievement',
            name: language === 'ml' ? 'നേട്ടങ്ങൾ കൈവരിക്കാനുള്ള ആഗ്രഹം' : 'Achievement & Mastery',
            score: (C * 0.7 + (100 - N) * 0.3),
            description: language === 'ml'
                ? 'സ്വന്തം കഴിവുകൾ മെച്ചപ്പെടുത്താനും വെല്ലുവിളികൾ ഏറ്റെടുക്കാനും ലക്ഷ്യങ്ങൾ നേടാനും ഉള്ള ആഗ്രഹം.'
                : 'Driven by setting goals, overcoming challenges, and mastering new skills.'
        },
        {
            id: 'power',
            name: language === 'ml' ? 'സ്വാധീനശക്തിയും നിയന്ത്രണവും' : 'Influence & Control',
            score: (E * 0.6 + (100 - A) * 0.4),
            description: language === 'ml'
                ? 'നേതൃത്വം നൽകാനും മറ്റുള്ളവരെ സ്വാധീനിക്കാനും അംഗീകാരം നേടാനും ഉള്ള ആഗ്രഹം.'
                : 'Motivated by leadership opportunities, status, and having an impact on others.'
        },
        {
            id: 'affiliation',
            name: language === 'ml' ? 'ബന്ധങ്ങളും സൗഹൃദവും' : 'Connection & Belonging',
            score: (E * 0.4 + A * 0.6),
            description: language === 'ml'
                ? 'നല്ല ബന്ധങ്ങൾ സൂക്ഷിക്കാനും, ടീമിനൊപ്പം പ്രവർത്തിക്കാനും, സൗഹൃദപരമായ അന്തരീക്ഷം ആഗ്രഹിക്കുന്നു.'
                : 'Driven by building relationships, harmony, and collaborating with a team.'
        },
        {
            id: 'autonomy',
            name: language === 'ml' ? 'സ്വാതന്ത്ര്യവും സ്വയംപര്യാപ്തതയും' : 'Autonomy & Independence',
            score: (O * 0.6 + (100 - A) * 0.2 + (100 - N) * 0.2), // High Openness usually likes freedom
            description: language === 'ml'
                ? 'സ്വതന്ത്രമായി പ്രവർത്തിക്കാനും, സ്വന്തം ഇഷ്ടപ്രകാരം തീരുമാനങ്ങൾ എടുക്കാനും ആഗ്രഹിക്കുന്നു.'
                : 'Motivated by freedom, flexibility, and the ability to choose your own path.'
        },
        {
            id: 'security',
            name: language === 'ml' ? 'സുരക്ഷിതത്വവും സ്ഥിരതയും' : 'Security & Stability',
            score: ((100 - O) * 0.5 + C * 0.3 + N * 0.2),
            description: language === 'ml'
                ? 'വ്യക്തമായ നിർദ്ദേശങ്ങളും, സുരക്ഷിതമായ സാഹചര്യവും, റിസ്ക് കുറഞ്ഞ ജോലികളും ഇഷ്ടപ്പെടുന്നു.'
                : 'Driven by clear expectations, stability, and risk mitigation.'
        }
    ].sort((a, b) => b.score - a.score);
};

export const deriveExcellenceProfile = (domains: Record<string, ScoreResult>) => {
    // HERO Model (Capital)
    const O = getP(domains, 'O');
    const C = getP(domains, 'C');
    const E = getP(domains, 'E');
    const N = getP(domains, 'N');
    // A is unused here

    // Hope: Agency (C) + Pathways (O)
    const hope = (C + O) / 2;
    // Efficacy: Confidence (E) + Competence (C)
    const efficacy = (E + C) / 2;
    // Resilience: Stability (Low N) + Adaptability (O)
    const resilience = ((100 - N) + O) / 2;
    // Optimism: Positive Affect (E) + Stability (Low N)
    const optimism = (E + (100 - N)) / 2;

    return { hope, efficacy, resilience, optimism };
};

export const identifySynergies = (domains: Record<string, ScoreResult>, language: string = 'en'): TraitSynergy[] => {
    const synergies: TraitSynergy[] = [];
    const O = getP(domains, 'O');
    const C = getP(domains, 'C');
    const E = getP(domains, 'E');
    const A = getP(domains, 'A');
    const N = getP(domains, 'N');

    const high = 70;
    const low = 30;

    // Creative Executor
    if (O > high && C > high) {
        synergies.push({
            name: language === 'ml' ? 'വിഷനറി ബിൽഡർ (Visionary Builder)' : 'The Visionary Builder',
            traits: language === 'ml' ? ['ഉയർന്ന ഓപ്പൺനെസ്സ്', 'ഉയർന്ന കൃത്യത'] : ['High Openness', 'High Conscientiousness'],
            description: language === 'ml'
                ? 'സ്വപ്‌നങ്ങൾ കാണാനും അത് പ്രാവർത്തികമാക്കാനും നിങ്ങൾക്ക് കഴിവുണ്ട്. പുതിയ ആശയങ്ങൾ നടപ്പിലാക്കാൻ മിടുക്കനാണ്.'
                : 'You have the rare ability to both dream big and execute the details. You can turn abstract ideas into reality.',
            type: 'strength'
        });
    }

    // Social Architect
    if (E > high && A > high) {
        synergies.push({
            name: language === 'ml' ? 'സോഷ്യൽ ആർക്കിടെക്റ്റ് (Social Architect)' : 'The Social Architect',
            traits: language === 'ml' ? ['ഉയർന്ന എക്സ്ട്രാവേർഷൻ', 'ഉയർന്ന സൗഹാർദ്ദം'] : ['High Extraversion', 'High Agreeableness'],
            description: language === 'ml'
                ? 'ആളുകളെ കൂട്ട യോജിപ്പിക്കാനും, സൗഹൃദപരമായ അന്തരീക്ഷം സൃഷ്ടിക്കാനും നിങ്ങൾക്ക് പ്രത്യേക കഴിവുണ്ട്.'
                : 'You are a natural community builder who thrives on bringing people together and maintaining harmony.',
            type: 'strength'
        });
    }

    // Competitive Commander
    if (E > high && A < low) {
        synergies.push({
            name: language === 'ml' ? 'ദ കമാൻഡർ (The Commander)' : 'The Commander',
            traits: language === 'ml' ? ['ഉയർന്ന എക്സ്ട്രാവേർഷൻ', 'കുറഞ്ഞ സൗഹാർദ്ദം'] : ['High Extraversion', 'Low Agreeableness'],
            description: language === 'ml'
                ? 'ലക്ഷ്യബോധമുള്ള, ധീരമായ തീരുമാനങ്ങൾ എടുക്കുന്ന പ്രകൃതം. കാര്യക്ഷമതയ്ക്കാണ് വികാരങ്ങളേക്കാൾ മുൻഗണന നൽകുന്നത്.'
                : 'You are direct, assertive, and focused on the goal. You prioritize truth and efficiency over feelings.',
            type: 'strength'
        });
    }

    // Sensitive Artist
    if (O > high && N > high) {
        synergies.push({
            name: language === 'ml' ? 'വികാാരധീനനായ കലാകാരൻ' : 'The Sensitive Creative',
            traits: language === 'ml' ? ['ഉയർന്ന ഓപ്പൺനെസ്സ്', 'ഉയർന്ന ന്യൂറോട്ടിസിസം'] : ['High Openness', 'High Neuroticism'],
            description: language === 'ml'
                ? 'നിങ്ങളുടെ വികാരങ്ങളാണ് നിങ്ങളുടെ സർഗാത്മകതയുടെ ഇന്ധനം. കാര്യങ്ങളെ ആഴത്തിൽ കാണാനുള്ള കഴിവുണ്ട്.'
                : 'Your emotional depth fuels your creativity. You feel things deeply which allows for profound artistic expression, but burnout is a risk.',
            type: 'strength'
        });
    }

    // Stoic Rock
    if (N < low && C > high) {
        synergies.push({
            name: language === 'ml' ? 'അചഞ്ചലനായ വ്യക്തി (The Stoic Rock)' : 'The Stoic Rock',
            traits: language === 'ml' ? ['കുറഞ്ഞ ന്യൂറോട്ടിസിസം', 'ഉയർന്ന കൃത്യത'] : ['Low Neuroticism', 'High Conscientiousness'],
            description: language === 'ml'
                ? 'ഏത് സമ്മർദ്ദഘട്ടത്തിലും തളരാതെ നിൽക്കാനും, വിശ്വസിക്കാൻ കൊള്ളാവുന്നതുമായ വ്യക്തിത്വം.'
                : 'Unflappable under pressure and highly reliable. People count on you when things go wrong.',
            type: 'strength'
        });
    }

    // Anxious Perfectionist
    if (N > high && C > high) {
        synergies.push({
            name: language === 'ml' ? 'പെർഫെക്ഷനിസ്റ്റ് (Anxious Perfectionist)' : 'The Anxious Perfectionist',
            traits: language === 'ml' ? ['ഉയർന്ന ന്യൂറോട്ടിസിസം', 'ഉയർന്ന കൃത്യത'] : ['High Neuroticism', 'High Conscientiousness'],
            description: language === 'ml'
                ? 'എല്ലാം കൃത്യമായിരിക്കണം എന്ന നിർബന്ധം നിങ്ങൾക്ക് സമ്മർദ്ദം ഉണ്ടാക്കിയേക്കാം. എന്നാൽ ഇത് ഉയർന്ന നിലവാരം ഉറപ്പാക്കുന്നു.'
                : 'You have extremely high standards and worry about not meeting them. This drives high quality but can generate significant stress.',
            type: 'challenge'
        });
    }

    return synergies;
};

export const deriveLearningStyle = (domains: Record<string, ScoreResult>, language: string = 'en'): LearningStyle => {
    const O = getP(domains, 'O');
    const E = getP(domains, 'E');

    if (O > 60 && E > 60) {
        return {
            style: language === 'ml' ? 'സജീവമായി പഠിക്കുന്നയാൾ (Active Explorer)' : 'Active Explorer',
            description: language === 'ml'
                ? 'പരീക്ഷണങ്ങളിലൂടെയും, ചർച്ചകളിലൂടെയും പഠിക്കാൻ ഇഷ്ടപ്പെടുന്നു. പുതിയ കാര്യങ്ങൾ പരീക്ഷിക്കാൻ താല്പര്യം.'
                : 'You learn best by doing, experimenting, and discussing ideas with others. You prefer variety and novelty.',
            tips: language === 'ml' ? ['ചർച്ചകളിൽ പങ്കെടുക്കുക', 'പരീക്ഷണങ്ങൾ നടത്തുക'] : ['Use group discussions', 'Experiment with trial and error', ' Avoid long lectures']
        };
    } else if (O > 60 && E <= 60) {
        return {
            style: language === 'ml' ? 'ചിന്തിച്ചു പഠിക്കുന്നയാൾ (Reflective Theorist)' : 'Reflective Theorist',
            description: language === 'ml'
                ? 'ആഴത്തിൽ ചിന്തിക്കാനും, വായനയിലൂടെ അറിവ് നേടാനും ഇഷ്ടപ്പെടുന്നു. യുക്തിക്കും സിദ്ധാന്തങ്ങൾക്കും പ്രാധാന്യം നൽകുന്നു.'
                : 'You enjoy deep diving into concepts, reading, and synthesizing information alone. You value logic and systems.',
            tips: language === 'ml' ? ['വിഷയങ്ങൾ ആഴത്തിൽ പഠിക്കുക', 'ചിന്തിക്കാൻ സമയം കണ്ടെത്തുക'] : ['Read theoretical frameworks', 'Allow time for reflection', 'Connect new ideas to existing knowledge']
        };
    } else if (O <= 60 && E > 60) {
        return {
            style: language === 'ml' ? 'പ്രായോഗികമായി പഠിക്കുന്നയാൾ (Practical Learner)' : 'Practical Social Learner',
            description: language === 'ml'
                ? 'ഉദാഹരണങ്ങളിലൂടെയും, മറ്റുള്ളവരോട് ചോദിച്ചും പഠിക്കാൻ ഇഷ്ടപ്പെടുന്നു. തിയറിയേക്കാൾ പ്രായോഗിക അറിവിനാണ് മുൻഗണന.'
                : 'You prefer practical, real-world examples and learning in a social group. You focus on "how" rather than "why".',
            tips: language === 'ml' ? ['പ്രായോഗിക പരിശീലനം', 'ഗ്രൂപ്പ് വർക്കുകൾ'] : ['Role-playing exercises', 'Interactive workshops', 'Focus on immediate application']
        };
    } else {
        return {
            style: language === 'ml' ? 'ചിട്ടയോടെ പഠിക്കുന്നയാൾ (Structured Learner)' : 'Structured Methodical Learner',
            description: language === 'ml'
                ? 'കൃത്യമായ നിർദ്ദേശങ്ങളും പ്ലാനുകളും അനുസരിച്ച് പഠിക്കാൻ ഇഷ്ടപ്പെടുന്നു. ചിട്ടയായ പഠനരീതിയാണ് നിങ്ങൾക്ക് അഭികാമ്യം.'
                : 'You learn best with clear instructions, step-by-step guides, and repetition. You value consistency and clear goals.',
            tips: language === 'ml' ? ['ടൈംടേബിൾ ഉപയോഗിക്കുക', 'നോട്ടുകൾ തയ്യാറാക്കുക'] : ['Follow structured courses', 'Practice consistently', 'Use checklists and guides']
        };
    }
};

export interface BroadCategoryResult {
    id: string;
    name: string;
    fit: 'High' | 'Medium' | 'Low';
    reason: string;
    color: string;
}

export const evaluateBroadCareerCategories = (results: any, language: string = 'en'): BroadCategoryResult[] => {
    // Scores are expected to be roughly -1 to 1 range (z-scores weighted)
    // We normalize them relative to each other for ranking, or use absolute thresholds if calibrated.
    // Given calculateRiasecScores uses z-scores, values can be around -2 to +2.
    // Thresholds: High > 0.5, Medium > -0.5, Low < -0.5 is a reasonable start.

    const t = language === 'ml' ? {
        cat_entrepreneur: "സംരംഭകത്വം (Entrepreneurship)",
        cat_corporate: "കോർപ്പറേറ്റ് നേൃത്വപാടവം (Corporate Leadership)",
        cat_academia: "ഗവേഷണം & അക്കാദമിക് (Research & Academia)",
        cat_creative: "സർഗ്ഗാത്മക മേഖലകൾ (Creative & Media)",
        cat_social: "സേവന മേഖലകൾ (Healthcare & Social Impact)",
        cat_tech: "സാങ്കേതികവിദ്യ & എഞ്ചിനീയറിംഗ് (Technology & Engineering)",

        // ... (We can reuse existing reasons or update them to be more RIASEC specific)
        // I will inline the specific reasons logic for simplicity and direct mapping
    } : {
        cat_entrepreneur: "Entrepreneurship & Business",
        cat_corporate: "Corporate Leadership",
        cat_academia: "Research & Academia",
        cat_creative: "Creative Arts & Media",
        cat_social: "Healthcare & Social Impact",
        cat_tech: "Technology & Engineering",
    };

    const riasec = results.riasec || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    // Mathematical Calculation from Holland Codes
    // Entrepreneurship: Driven by Enterprising (Risk/Leadership) + Realistic/Artistic (Creation)
    const entreScore = (riasec.E * 0.7 + Math.max(riasec.R, riasec.A) * 0.3);

    // Corporate: Enterprising (Leadership) + Conventional (Organization)
    const corpScore = (riasec.E * 0.6 + riasec.C * 0.4);

    // Academia: Investigative (Research)
    const acadScore = riasec.I;

    // Creative: Artistic (Expression)
    const creativeScore = riasec.A;

    // Social: Social (Helping)
    const socialScore = riasec.S;

    // Tech: Realistic (Hands-on) + Investigative (Problem Solving)
    const techScore = (riasec.R * 0.5 + riasec.I * 0.5);

    const getFit = (score: number) => {
        if (score > 0.5) return 'High';
        if (score > -0.5) return 'Medium';
        return 'Low';
    };

    const getReason = (cat: string, fit: string) => {
        const isMl = language === 'ml';
        if (cat === 'entrepreneur') {
            if (fit === 'High') return isMl ? "നിങ്ങളുടെ ഉയർന്ന 'Enterprising' സ്കോർ ബിസിനസ്സ് ആശയങ്ങൾ നടപ്പിലാക്കാനുള്ള കഴിവിനെ സൂചിപ്പിക്കുന്നു." : "Your strong 'Enterprising' score combined with practical/creative drive makes you a natural fit for building ventures.";
            if (fit === 'Medium') return isMl ? "നിങ്ങൾക്ക് ബിസിനസ്സ് താൽപ്പര്യമുണ്ടെങ്കിലും, റിസ്ക് എടുക്കാനുള്ള പ്രവണത മിതമായതാണ്." : "You have some entrepreneurial drive (Enterprising), but may prefer calculated risks over pure venture building.";
            return isMl ? "നിങ്ങൾ സ്ഥിരതയുള്ള വരുമാനവും കുറഞ്ഞ റിസ്കുമാണ് ആഗ്രഹിക്കുന്നത്." : "You likely prefer the stability of established structures over the uncertainty of entrepreneurship.";
        }
        if (cat === 'corporate') {
            if (fit === 'High') return isMl ? "ഓർഗനൈസേഷനുകൾ നയിക്കാനുള്ള (Enterprising & Conventional) കഴിവ് നിങ്ങൾക്ക് കൂടുതലാണ്." : "Your blend of 'Enterprising' leadership and 'Conventional' organization suits corporate management perfectly.";
            if (fit === 'Medium') return isMl ? "കോർപ്പറേറ്റ് അന്തരീക്ഷം നിങ്ങൾക്ക് യോജിക്കുമെങ്കിലും, കൂടുതൽ സ്വാതന്ത്ര്യം നിങ്ങൾ ആഗ്രഹിച്ചേക്കാം." : "You fit reasonably well in corporate settings but might find rigid hierarchies confining at times.";
            return isMl ? "അധികാരശ്രേണികളുള്ള (Hierarchy) കോർപ്പറേറ്റ് രീതികളോട് നിങ്ങൾക്ക് താൽപ്പര്യം കുറവാണ്." : "You may find corporate politics and rigid structures draining, preferring more autonomy.";
        }
        if (cat === 'academia') {
            if (fit === 'High') return isMl ? "ഗവേഷണത്തോടുള്ള നിറഞ്ഞ താൽപ്പര്യം (High Investigative) നിങ്ങളെ അക്കാദമിക് മേഖലയിൽ ശോഭിപ്പിക്കും." : "Your dominant 'Investigative' trait drives distinct intellectual curiosity perfect for research and academia.";
            if (fit === 'Medium') return isMl ? "പഠനം ഇഷ്ടമാണെങ്കിലും, തിയറികളേക്കാൾ പ്രായോഗിക തലത്തിനാണ് നിങ്ങൾ മുൻഗണന നൽകുന്നത്." : "You enjoy learning (Investigative) but may prefer applying knowledge practically rather than pure academic research.";
            return isMl ? "തിയറികളെക്കാൾ പ്രായോഗിക കാര്യങ്ങളിലാണ് നിങ്ങൾക്ക് കൂടുതൽ താൽപ്പര്യം." : "Abstract research may feel too disconnected from action for your preference.";
        }
        if (cat === 'creative') {
            if (fit === 'High') return isMl ? "നിങ്ങളുടെ ഉയർന്ന 'Artistic' സ്കോർ സർഗ്ഗാത്മക മേഖലകളിലെ മികച്ച പ്രകടനത്തെ സൂചിപ്പിക്കുന്നു." : "Your high 'Artistic' score indicates a powerful need for self-expression and creative freedom.";
            if (fit === 'Medium') return isMl ? "സർഗ്ഗാത്മകത ഉണ്ടെങ്കിലും, അത് ഒരു ഹോബിയായിരിക്കാനാണ് സാധ്യത കൂടുതൽ." : "You appreciate creativity but may prefer it balanced with structure rather than total artistic chaos.";
            return isMl ? "കലാപരമായ കാര്യങ്ങളേക്കാൾ, വ്യക്തതയുള്ളതും യുക്തിസഹവുമായ കാര്യങ്ങളാണ് നിങ്ങൾക്ക് ഇഷ്ടം." : "You likely prioritize functionality and logic over purely aesthetic or abstract expression.";
        }
        if (cat === 'social') {
            if (fit === 'High') return isMl ? "മറ്റുള്ളവരെ സഹായിക്കാനുള്ള മനസ്സ് (High Social) നിങ്ങളെ സേവന മേഖലകളിൽ മികച്ചതാക്കും." : "Your 'Social' score highlights a deep drive to help, teach, or counsel others effectively.";
            if (fit === 'Medium') return isMl ? "ആളുകളുമായി ഇടപഴകാൻ ഇഷ്ടമാണെങ്കിലും, അത് നിങ്ങളുടെ പ്രധാന തൊഴിൽ ലക്ഷ്യമല്ല." : "You enjoy helping others but need balance to avoid emotional burnout causing fatigue.";
            return isMl ? "വൈകാരികമായ ഇടപെടലുകളേക്കാൾ, വസ്തുനിഷ്ഠമായ കാര്യങ്ങളാണ് നിങ്ങൾ ഇഷ്ടപ്പെടുന്നത്." : "You prefer objective tasks over roles requiring constant emotional labor or caregiving.";
        }
        if (cat === 'tech') {
            if (fit === 'High') return isMl ? "സാങ്കേതിക കാര്യങ്ങളിലെ താൽപ്പര്യം (Realistic & Investigative) നിങ്ങളെ ഈ മേഖലയിൽ വിജയിപ്പിക്കും." : "The combination of 'Realistic' practicality and 'Investigative' problem-solving makes a distinct tech/engineering fit.";
            if (fit === 'Medium') return isMl ? "സാങ്കേതികവിദ്യ ഇഷ്ടമാണെങ്കിലും, അതിൽ മാത്രം ഒതുങ്ങിനിൽക്കാൻ നിങ്ങൾ ആഗ്രഹിച്ചേക്കില്ല." : "You are capable with technology but may miss the human or creative element if the role is too purely technical.";
            return isMl ? "യന്ത്രങ്ങളേക്കാളും കോഡുകളേക്കാളും നിങ്ങൾക്ക് താൽപ്പര്യം മനുഷ്യരുമായോ ആശയങ്ങളുമായോ ഉള്ള ഇടപെടലായിരിക്കും." : "You likely prefer working with people or ideas rather than purely with code, machines, or hardware.";
        }
        return "";
    };

    const makeCat = (id: string, name: string, score: number, color: string): BroadCategoryResult => ({
        id, name, fit: getFit(score), reason: getReason(id, getFit(score)), color
    });

    return [
        makeCat('entrepreneur', t.cat_entrepreneur, entreScore, '#ea580c'),
        makeCat('corporate', t.cat_corporate, corpScore, '#0284c7'),
        makeCat('academia', t.cat_academia, acadScore, '#7c3aed'),
        makeCat('creative', t.cat_creative, creativeScore, '#db2777'),
        makeCat('social', t.cat_social, socialScore, '#059669'),
        makeCat('tech', t.cat_tech, techScore, '#4f46e5')
    ];
};
