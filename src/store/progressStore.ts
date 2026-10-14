import {create} from 'zustand';
import {persist} from 'zustand/middleware';

/** Local calendar day, e.g. `2026-10-14`. */
export const dayKey = (date = new Date()) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
};

export const chapterKey = (bookId: string, chapter: number) => `${bookId}:${chapter}`;

const LOG_RETENTION_DAYS = 400;

type ActivePlan = {
    planId: string;
    startedAt: string;
};

type ProgressState = {
    /** chapterKey → ISO timestamp when it was first completed. */
    readChapters: Record<string, string>;
    /** dayKey → chapterKeys completed that day. */
    log: Record<string, string[]>;
    plans: ActivePlan[];
    markChapterRead: (bookId: string, chapter: number) => void;
    unmarkChapter: (bookId: string, chapter: number) => void;
    startPlan: (planId: string) => void;
    stopPlan: (planId: string) => void;
    resetProgress: () => void;
};

const pruneLog = (log: Record<string, string[]>) => {
    const cutoff = dayKey(new Date(Date.now() - LOG_RETENTION_DAYS * 86_400_000));
    return Object.fromEntries(Object.entries(log).filter(([day]) => day >= cutoff));
};

export const useProgressStore = create<ProgressState>()(
    persist(
        set => ({
            readChapters: {},
            log: {},
            plans: [],
            markChapterRead: (bookId, chapter) =>
                set(state => {
                    const key = chapterKey(bookId, chapter);
                    const today = dayKey();
                    const todays = state.log[today] ?? [];
                    if (state.readChapters[key] && todays.includes(key)) {
                        return state;
                    }
                    return {
                        readChapters: state.readChapters[key]
                            ? state.readChapters
                            : {...state.readChapters, [key]: new Date().toISOString()},
                        log: pruneLog({...state.log, [today]: todays.includes(key) ? todays : [...todays, key]})
                    };
                }),
            unmarkChapter: (bookId, chapter) =>
                set(state => {
                    const key = chapterKey(bookId, chapter);
                    const readChapters = {...state.readChapters};
                    delete readChapters[key];
                    const log = Object.fromEntries(
                        Object.entries(state.log)
                            .map(([day, keys]) => [day, keys.filter(item => item !== key)] as const)
                            .filter(([, keys]) => keys.length > 0)
                    );
                    return {readChapters, log};
                }),
            startPlan: planId =>
                set(state =>
                    state.plans.some(plan => plan.planId === planId)
                        ? state
                        : {plans: [{planId, startedAt: new Date().toISOString()}, ...state.plans]}
                ),
            stopPlan: planId => set(state => ({plans: state.plans.filter(plan => plan.planId !== planId)})),
            resetProgress: () => set({readChapters: {}, log: {}, plans: []})
        }),
        {name: 'tb-web-progress-v1'}
    )
);

export type StreakSummary = {
    current: number;
    best: number;
    readToday: boolean;
    activeDays: number;
};

export const summarizeStreak = (log: Record<string, string[]>, now = new Date()): StreakSummary => {
    const days = Object.keys(log)
        .filter(day => log[day].length > 0)
        .sort();
    const daySet = new Set(days);
    const today = dayKey(now);
    const yesterday = dayKey(new Date(now.getTime() - 86_400_000));

    let best = 0;
    let run = 0;
    let previous: string | null = null;
    for (const day of days) {
        const expected = previous ? dayKey(new Date(new Date(`${previous}T12:00:00`).getTime() + 86_400_000)) : null;
        run = previous && expected === day ? run + 1 : 1;
        best = Math.max(best, run);
        previous = day;
    }

    let current = 0;
    if (daySet.has(today) || daySet.has(yesterday)) {
        let cursor = new Date(`${daySet.has(today) ? today : yesterday}T12:00:00`);
        while (daySet.has(dayKey(cursor))) {
            current += 1;
            cursor = new Date(cursor.getTime() - 86_400_000);
        }
    }

    return {current, best, readToday: daySet.has(today), activeDays: days.length};
};

/** Chapters completed per day for the last `count` days, oldest first. */
export const recentDays = (log: Record<string, string[]>, count = 7, now = new Date()) =>
    Array.from({length: count}, (_, index) => {
        const date = new Date(now.getTime() - (count - 1 - index) * 86_400_000);
        const key = dayKey(date);
        return {day: key, date, chapters: log[key]?.length ?? 0};
    });
