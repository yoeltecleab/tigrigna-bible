import type {Book} from '../types/bible';
import {chapterKey} from '../store/progressStore';

type Localized = {en: string; ti: string};

export type PlanScope = {books: string[]} | {testament: 'old' | 'new' | 'all'};

export type PlanDefinition = {
    id: string;
    days: number;
    title: Localized;
    description: Localized;
    scope: PlanScope;
    tone: 'gold' | 'rose' | 'sky' | 'green' | 'violet' | 'ink';
};

export type PlanChapter = {bookId: string; chapter: number};

export type PlanProgress = {
    plan: PlanDefinition;
    schedule: PlanChapter[][];
    completedDays: number;
    currentDay: number;
    today: PlanChapter[];
    percent: number;
    done: boolean;
};

const GOSPELS = ['MATIEWOS', 'MARK', 'LUKAS', 'JONE'];

export const PLANS: PlanDefinition[] = [
    {
        id: 'john-21',
        days: 21,
        tone: 'gold',
        scope: {books: ['JONE']},
        title: {en: 'The Gospel of John', ti: 'ወንጌል ዮሓንስ'},
        description: {en: 'One chapter a day through the life and words of Jesus.', ti: 'ኣብ መዓልቲ ሓደ ምዕራፍ — ህይወትን ቃላትን ኢየሱስ።'}
    },
    {
        id: 'proverbs-31',
        days: 31,
        tone: 'green',
        scope: {books: ['MSALIE']},
        title: {en: 'Proverbs for a month', ti: 'ምሳሌ ንሓደ ወርሒ'},
        description: {en: 'Daily wisdom — a chapter of Proverbs for each day.', ti: 'ዕለታዊ ጥበብ — ንነፍሲ ወከፍ መዓልቲ ሓደ ምዕራፍ።'}
    },
    {
        id: 'psalms-30',
        days: 30,
        tone: 'sky',
        scope: {books: ['DAWIT']},
        title: {en: 'Psalms in 30 days', ti: 'መዝሙር ዳዊት ኣብ 30 መዓልቲ'},
        description: {en: 'Pray through all 150 psalms, five a day.', ti: 'ኩሉ 150 መዝሙራት፡ ኣብ መዓልቲ ሓሙሽተ።'}
    },
    {
        id: 'gospels-40',
        days: 40,
        tone: 'rose',
        scope: {books: GOSPELS},
        title: {en: 'The four Gospels', ti: 'ኣርባዕተ ወንጌላት'},
        description: {en: 'Matthew, Mark, Luke and John in forty days.', ti: 'ማቴዎስ፡ ማርቆስ፡ ሉቃስን ዮሓንስን ኣብ 40 መዓልቲ።'}
    },
    {
        id: 'nt-90',
        days: 90,
        tone: 'violet',
        scope: {testament: 'new'},
        title: {en: 'New Testament in 90 days', ti: 'ሓድሽ ኪዳን ኣብ 90 መዓልቲ'},
        description: {en: 'About three chapters a day from Matthew to Revelation.', ti: 'ኣብ መዓልቲ ኣስታት ሰለስተ ምዕራፋት።'}
    },
    {
        id: 'bible-365',
        days: 365,
        tone: 'ink',
        scope: {testament: 'all'},
        title: {en: 'The whole Bible in a year', ti: 'ምሉእ መጽሓፍ ቅዱስ ኣብ ሓደ ዓመት'},
        description: {en: 'Every book, Genesis to Revelation, over 365 days.', ti: 'ካብ ዘፍጥረት ክሳዕ ራእይ ኣብ 365 መዓልቲ።'}
    }
];

export const getPlan = (planId: string) => PLANS.find(plan => plan.id === planId) ?? null;

const scopeChapters = (scope: PlanScope, books: Book[]): PlanChapter[] => {
    const ordered = [...books].sort((left, right) => left.order - right.order);
    const selected =
        'books' in scope
            ? scope.books.map(id => ordered.find(book => book.id === id)).filter((book): book is Book => Boolean(book))
            : ordered.filter(book => scope.testament === 'all' || book.testament === scope.testament);
    return selected.flatMap(book => Array.from({length: book.chaptersNum}, (_, index) => ({bookId: book.id, chapter: index + 1})));
};

/** Split the plan's chapters evenly across its days (earlier days take the remainder). */
export const buildSchedule = (plan: PlanDefinition, books: Book[]): PlanChapter[][] => {
    const chapters = scopeChapters(plan.scope, books);
    const days = Math.min(plan.days, Math.max(1, chapters.length));
    const base = Math.floor(chapters.length / days);
    const extra = chapters.length % days;
    const schedule: PlanChapter[][] = [];
    let cursor = 0;
    for (let day = 0; day < days; day += 1) {
        const size = base + (day < extra ? 1 : 0);
        schedule.push(chapters.slice(cursor, cursor + size));
        cursor += size;
    }
    return schedule;
};

export const planProgress = (plan: PlanDefinition, books: Book[], readChapters: Record<string, string>): PlanProgress => {
    const schedule = buildSchedule(plan, books);
    const isDone = (day: PlanChapter[]) => day.every(item => readChapters[chapterKey(item.bookId, item.chapter)]);
    const completedDays = schedule.filter(isDone).length;
    const firstOpen = schedule.findIndex(day => !isDone(day));
    const currentDay = firstOpen === -1 ? schedule.length : firstOpen + 1;
    const total = schedule.reduce((sum, day) => sum + day.length, 0);
    const read = schedule.reduce(
        (sum, day) => sum + day.filter(item => readChapters[chapterKey(item.bookId, item.chapter)]).length,
        0
    );
    return {
        plan,
        schedule,
        completedDays,
        currentDay,
        today: firstOpen === -1 ? [] : schedule[firstOpen],
        percent: total > 0 ? Math.round((read / total) * 100) : 0,
        done: firstOpen === -1
    };
};

/** First unread chapter of today's reading — where "Continue plan" should land. */
export const nextPlanChapter = (progress: PlanProgress, readChapters: Record<string, string>) =>
    progress.today.find(item => !readChapters[chapterKey(item.bookId, item.chapter)]) ?? progress.today[0] ?? null;
