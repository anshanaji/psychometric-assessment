import type { MbtiResult, UserAnswers } from '../types';
import mbtiItems from '../data/mbti_items.json';
import mbtiProfiles from '../data/mbti_profiles.json';

export const calculateMbti = (answers: UserAnswers, language: 'en' | 'ml' = 'en'): MbtiResult => {
    const scores = {
        E: 0, I: 0,
        S: 0, N: 0,
        T: 0, F: 0,
        J: 0, P: 0
    };

    // Calculate raw scores
    // Each item is keyed to a dimension letter (e.g. "E").
    // If user answers 5 (Strongly Agree) to an "E" item -> +5 to E.
    // However, usually MBTI is dichotomous scoring or differential.
    // Let's use simple summation for each pole.
    // Items in mbti_items.json have "keyed": "E" or "I" etc.

    (mbtiItems as any[]).forEach(item => {
        const answer = answers[item.id] || 3; // Default neutral if missing

        // Items are positively keyed to their labeled dimension
        // e.g. text: "I like parties", keyed: "E". Answer 5 => high E.
        // answer is 1-5.

        const pole = item.keyed;
        scores[pole as keyof typeof scores] += answer;
    });

    // Determine type
    const type = [
        scores.E >= scores.I ? 'E' : 'I',
        scores.S >= scores.N ? 'S' : 'N',
        scores.T >= scores.F ? 'T' : 'F',
        scores.J >= scores.P ? 'J' : 'P'
    ].join('');

    const profile = (mbtiProfiles as any)[type];

    return {
        type,
        scores,
        details: {
            name: language === 'ml' ? profile.name_ml : profile.name,
            description: language === 'ml' ? profile.description_ml : profile.description,
            careers: profile.careers
        }
    };
};
