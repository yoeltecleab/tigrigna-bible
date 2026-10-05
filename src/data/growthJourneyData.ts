export type ProgressBadge = {
    id: string;
    title: string;
    status: 'earned' | 'locked';
    icon: string;
};

export type JourneyQuest = {
    id: string;
    title: string;
    detail: string;
    progressLabel: string;
    tone: 'gold' | 'red' | 'blue';
};

export type SuggestedPlan = {
    id: string;
    duration: string;
    title: string;
    detail: string;
    tone: 'plan-card-1' | 'plan-card-2' | 'plan-card-3';
};

export type GrowthInput = {
    bookmarks: number;
    highlights: number;
    notes: number;
    collectionLinks: number;
    activeDays: number;
};

export type GrowthSnapshot = {
    seekerLevel: number;
    soulProgressPercent: number;
    apostleRank: string;
    xp: number;
    streakDays: number;
    dailyVerseReference: 'John 1:5',
    dailyVerseQuote: '"The light shines in the darkness, and the darkness has not overcome it."',
    badges: ProgressBadge[];
    quests: JourneyQuest[];
    suggestedPlans: SuggestedPlan[];
};

export const suggestedPlans: SuggestedPlan[] = [
    {
        id: 'steps-of-saints',
        duration: '14 days',
        title: 'Steps of the Saints',
        detail: 'A journey through hagiography and mission.',
        tone: 'plan-card-1'
    },
    {
        id: 'fasting-prayer',
        duration: '7 days',
        title: 'Fasting and Prayer',
        detail: 'Liturgical depth of Tewahedo fasting traditions.',
        tone: 'plan-card-2'
    },
    {
        id: 'miracles-of-mary',
        duration: '21 days',
        title: 'Miracles of Mary',
        detail: 'Daily meditations and sacred reflections.',
        tone: 'plan-card-3'
    }
] as const;

export const getGrowthJourneySnapshot = (input: GrowthInput): GrowthSnapshot => {
    const totalActions = input.bookmarks + input.highlights + input.notes + input.collectionLinks;
    const seekerLevel = Math.max(1, Math.min(99, Math.floor(totalActions / 8) + 1));
    const soulProgressPercent = Math.max(4, Math.min(100, Math.round((totalActions / 60) * 100)));
    const xp = totalActions * 35;
    const streakDays = Math.max(1, input.activeDays);

    return {
        seekerLevel,
        soulProgressPercent,
        apostleRank: seekerLevel >= 40 ? 'Apostle rank' : seekerLevel >= 20 ? 'Seeker rank' : 'Pilgrim rank',
        xp,
        streakDays,
        dailyVerseReference: 'John 1:5',
        dailyVerseQuote: '"The light shines in the darkness, and the darkness has not overcome it."',
        badges: [
            {id: 'dawn-seeker', title: 'Dawn seeker', status: input.bookmarks >= 5 ? 'earned' : 'locked', icon: 'wb_sunny'},
            {id: 'scribe-initiate', title: 'Scribe initiate', status: input.notes >= 3 ? 'earned' : 'locked', icon: 'history_edu'},
            {id: 'vigil-keeper', title: 'Vigil keeper', status: input.highlights >= 5 ? 'earned' : 'locked', icon: 'church'},
            {id: 'martyr-path', title: "Martyr's path", status: streakDays >= 30 ? 'earned' : 'locked', icon: 'lock'}
        ],
        quests: [
            {
                id: 'thought-collector',
                title: 'Thought Collector',
                detail: 'Write and keep ten reflection notes.',
                progressLabel: `${Math.min(input.notes, 10)}/10`,
                tone: 'gold'
            },
            {
                id: 'silent-prayer',
                title: 'Silent Prayer',
                detail: 'Save twenty meaningful passages.',
                progressLabel: `${Math.min(totalActions, 20)}/20`,
                tone: 'red'
            }
        ],
        suggestedPlans: [...suggestedPlans]
    };
};
