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

export const evaluateBroadCareerCategories = (domains: Record<string, ScoreResult>, language: string = 'en'): BroadCategoryResult[] => {
    const t = language === 'ml' ? {
        cat_entrepreneur: "സംരംഭകത്വം (Entrepreneurship)",
        cat_corporate: "കോർപ്പറേറ്റ് നേൃത്വപാടവം (Corporate Leadership)",
        cat_academia: "ഗവേഷണം & അക്കാദമിക് (Research & Academia)",
        cat_creative: "സർഗ്ഗാത്മക മേഖലകൾ (Creative & Media)",
        cat_social: "സേവന മേഖലകൾ (Healthcare & Social Impact)",
        cat_tech: "സാങ്കേതികവിദ്യ & എഞ്ചിനീയറിംഗ് (Technology & Engineering)",

        reason_entrepreneur_high: "ഉയർന്ന ആത്മവിശ്വാസം, പുതിയ ആശയങ്ങൾ പരീക്ഷിക്കാനുള്ള താൽപ്പര്യവും (High Openness) കഠിനാധ്വാനശീലവും (High Conscientiousness) നിങ്ങളെ മികച്ച സംരംഭകനാക്കുന്നു.",
        reason_entrepreneur_low: "റിസ്ക് എടുക്കാനുള്ള മടിയും (Low Openness) അനിശ്ചിതത്വങ്ങളോടുള്ള ഭയവും (Low Neuroticism Stability) തടസ്സമായേക്കാം.",

        reason_corporate_high: "ആളുകളെ നയിക്കാനുള്ള കഴിവ് (High Extraversion), ചിട്ടയായ പ്രവർത്തനരീതി (High Conscientiousness) എന്നിവ കോർപ്പറേറ്റ് ലോകത്ത് വിജയം ഉറപ്പാക്കുന്നു.",
        reason_corporate_low: "ആൾക്കൂട്ടത്തിൽ നിന്നുള്ള അകലം, നേതൃത്വമേറ്റെടുക്കാനുള്ള വിമുഖത എന്നിവ വെല്ലുവിളിയായേക്കാം.",

        reason_academia_high: "ആഴത്തിലുള്ള പഠനത്തോടുള്ള താൽപ്പര്യം (High Openness), വിശകലനത്തിനുള്ള ക്ഷമ എന്നിവ ഗവേഷണത്തിന് അനുയോജ്യമാണ്.",
        reason_academia_low: "തിയറികളേക്കാൾ പ്രായോഗിക കാര്യങ്ങളിൽ മാത്രം ശ്രദ്ധ കേന്ദ്രീകരിക്കുന്നത് ഗവേഷണത്തെ ബാധിക്കാം.",

        reason_creative_high: "ഭാവനയും (Abstract thinking) സർഗ്ഗാത്മകതയും (High Openness) കലാരംഗത്ത് വലിയ നേട്ടങ്ങൾ സമ്മാനിക്കും.",
        reason_creative_low: "പരമ്പരാഗത രീതികളോടുള്ള അമിതമായ താൽപ്പര്യം (Low Openness) പുതുമയുള്ള സൃഷ്ടികൾക്ക് തടസ്സമാകാം.",

        reason_social_high: "മറ്റുള്ളവരെ സഹായിക്കാനുള്ള മനസ്സും (High Agreeableness) സഹാനുഭൂതിയും സേവന മേഖലകളിൽ തിളങ്ങാൻ സഹായിക്കും.",
        reason_social_low: "മറ്റുള്ളവരുടെ വികാരങ്ങളേക്കാൾ സ്വന്തം യുക്തിക്ക് പ്രാധാന്യം നൽകുന്നത് ഈ മേഖലയിൽ വെല്ലുവിളിയാകാം.",

        reason_tech_high: "വിശദാംശങ്ങളിലെ ശ്രദ്ധയും (Conscientiousness) യുക്തി സഹമായ ചിന്തയും സാങ്കേതിക മേഖലയ്ക്ക് മുതൽക്കൂട്ടാണ്.",
        reason_tech_low: "കൃത്യതയും ഏകാഗ്രതയും കുറവായിരിക്കുന്നത് (Low Conscientiousness) സാങ്കേതിക ജോലികളിൽ പിഴവുകൾക്ക് കാരണാമാകാം.", // Generalization
    } : {
        cat_entrepreneur: "Entrepreneurship & Business",
        cat_corporate: "Corporate Leadership",
        cat_academia: "Research & Academia",
        cat_creative: "Creative Arts & Media",
        cat_social: "Healthcare & Social Impact",
        cat_tech: "Technology & Engineering",

        reason_entrepreneur_high: "Your mix of high Openness (innovation) and Conscientiousness (execution) makes you a natural fit for building ventures.",
        reason_entrepreneur_low: "You may find the uncertainty and high-risk nature of entrepreneurship draining due to lower risk tolerance.",

        reason_corporate_high: "High Extraversion (leadership) and Conscientiousness (organization) equip you well for executive roles.",
        reason_corporate_low: "You might prefer independent contribution over managing large teams or navigating corporate politics.",

        reason_academia_high: "Your distinct intellectual curiosity (Openness) drives you to explore complex theories and research deeply.",
        reason_academia_low: "You likely prefer practical, hands-on action over theoretical study or long-term research.",

        reason_creative_high: "Your high Openness fuels a vivid imagination, essential for design, writing, and artistic expression.",
        reason_creative_low: "You tend to value tradition and established methods, which may conflict with the constant reinvention needed in arts.",

        reason_social_high: "High Agreeableness and empathy make you naturally suited for roles requiring care, counseling, and social support.",
        reason_social_low: "You may prioritize objective logic over emotional connection, making purely care-giving roles less satisfying.",

        reason_tech_high: "Your structured approach (Conscientiousness) and logical mindset fit well with engineering and technical problem-solving.",
        reason_tech_low: "You might find the rigid accuracy and detail-oriented nature of engineering roles restrictive or draining.",
    };

    const categories: BroadCategoryResult[] = [];
    const getP = (key: string) => domains[key]?.percentile || 50;
    const O = getP('O');
    const C = getP('C');
    const E = getP('E');
    const A = getP('A');
    const N = getP('N');

    // Entrepreneurship: Needs Openness (Ideas) + Conscientiousness (Drive) + Emotional Stability (Resilience)
    const entreScore = (O + C + (100 - N)) / 3;
    categories.push({
        id: 'entrepreneur',
        name: t.cat_entrepreneur,
        fit: entreScore > 65 ? 'High' : entreScore > 40 ? 'Medium' : 'Low',
        reason: entreScore > 40 ? t.reason_entrepreneur_high : t.reason_entrepreneur_low,
        color: '#f59e0b'
    });

    // Corporate: Extraversion (People) + Conscientiousness (Order)
    const corpScore = (E + C) / 2;
    categories.push({
        id: 'corporate',
        name: t.cat_corporate,
        fit: corpScore > 65 ? 'High' : corpScore > 40 ? 'Medium' : 'Low',
        reason: corpScore > 40 ? t.reason_corporate_high : t.reason_corporate_low,
        color: '#3b82f6'
    });

    // Academia: Openness (Curiosity) + Conscientiousness (Focus)
    const acadScore = (O * 0.7 + C * 0.3);
    categories.push({
        id: 'academia',
        name: t.cat_academia,
        fit: acadScore > 70 ? 'High' : acadScore > 45 ? 'Medium' : 'Low',
        reason: acadScore > 45 ? t.reason_academia_high : t.reason_academia_low,
        color: '#8b5cf6'
    });

    // Creative: Openness dominant
    const creativeScore = O;
    categories.push({
        id: 'creative',
        name: t.cat_creative,
        fit: creativeScore > 70 ? 'High' : creativeScore > 45 ? 'Medium' : 'Low',
        reason: creativeScore > 45 ? t.reason_creative_high : t.reason_creative_low,
        color: '#ec4899'
    });

    // Social: Agreeableness + Extraversion
    const socialScore = (A + E) / 2;
    categories.push({
        id: 'social',
        name: t.cat_social,
        fit: socialScore > 60 ? 'High' : socialScore > 35 ? 'Medium' : 'Low',
        reason: socialScore > 35 ? t.reason_social_high : t.reason_social_low,
        color: '#10b981'
    });

    // Tech: Conscientiousness + Openness (Learning)
    const techScore = (C + O) / 2;
    categories.push({
        id: 'tech',
        name: t.cat_tech,
        fit: techScore > 60 ? 'High' : techScore > 40 ? 'Medium' : 'Low',
        reason: techScore > 40 ? t.reason_tech_high : t.reason_tech_low,
        color: '#6366f1'
    });

    return categories;
};
