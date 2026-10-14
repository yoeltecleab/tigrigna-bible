import type {Book} from '../types/bible';
import {chapterKey, dayKey, type StreakSummary} from '../store/progressStore';
import type {UiLanguage} from '../i18n/ui';

type Localized = {en: string; ti: string};

export type Badge = {
    id: string;
    icon: string;
    title: string;
    detail: string;
    earned: boolean;
    progress: number;
    goal: number;
};

export type Quest = {
    id: string;
    title: string;
    detail: string;
    progress: number;
    goal: number;
};

export type GrowthInput = {
    books: Book[];
    readChapters: Record<string, string>;
    log: Record<string, string[]>;
    streak: StreakSummary;
    highlights: number;
    notes: number;
    completedPlans: number;
};

const bookComplete = (book: Book | undefined, readChapters: Record<string, string>) =>
    book ? countRead([book], readChapters) : 0;

const countRead = (books: Book[], readChapters: Record<string, string>) =>
    books.reduce((sum, book) => {
        let read = 0;
        for (let chapter = 1; chapter <= book.chaptersNum; chapter += 1) {
            if (readChapters[chapterKey(book.id, chapter)]) read += 1;
        }
        return sum + read;
    }, 0);

const chapterTotal = (books: Book[]) => books.reduce((sum, book) => sum + book.chaptersNum, 0);

const pick = (text: Localized, language: UiLanguage) => text[language] ?? text.en;

export const buildBadges = (input: GrowthInput, language: UiLanguage): Badge[] => {
    const byId = new Map(input.books.map(book => [book.id, book]));
    const gospels = ['MATIEWOS', 'MARK', 'LUKAS', 'JONE'].map(id => byId.get(id)).filter((book): book is Book => Boolean(book));
    const newTestament = input.books.filter(book => book.testament === 'new');
    const totalRead = Object.keys(input.readChapters).length;

    const defs: Array<{id: string; icon: string; title: Localized; detail: Localized; progress: number; goal: number}> = [
        {
            id: 'first-steps',
            icon: 'sunny',
            title: {en: 'First steps', ti: 'ቀዳማይ ስጉምቲ'},
            detail: {en: 'Finish your first chapter', ti: 'ቀዳማይ ምዕራፍካ ወድእ'},
            progress: totalRead,
            goal: 1
        },
        {
            id: 'week-faithful',
            icon: 'flame',
            title: {en: 'Faithful week', ti: 'እሙን ሰሙን'},
            detail: {en: 'Read 7 days in a row', ti: '7 መዓልቲ ብተኸታታሊ ኣንብብ'},
            progress: input.streak.best,
            goal: 7
        },
        {
            id: 'month-faithful',
            icon: 'church',
            title: {en: 'Faithful month', ti: 'እሙን ወርሒ'},
            detail: {en: 'Read 30 days in a row', ti: '30 መዓልቲ ብተኸታታሊ ኣንብብ'},
            progress: input.streak.best,
            goal: 30
        },
        {
            id: 'gospel-reader',
            icon: 'menu_book',
            title: {en: 'Gospel reader', ti: 'ኣንባቢ ወንጌል'},
            detail: {en: 'Read all four Gospels', ti: 'ኩለን ኣርባዕተ ወንጌላት ኣንብብ'},
            progress: countRead(gospels, input.readChapters),
            goal: Math.max(1, chapterTotal(gospels))
        },
        {
            id: 'psalmist',
            icon: 'music',
            title: {en: 'Psalmist', ti: 'መዘምር'},
            detail: {en: 'Read all 150 Psalms', ti: 'ኩሉ 150 መዝሙራት ኣንብብ'},
            progress: bookComplete(byId.get('DAWIT'), input.readChapters),
            goal: byId.get('DAWIT')?.chaptersNum ?? 150
        },
        {
            id: 'new-covenant',
            icon: 'sparkles',
            title: {en: 'New covenant', ti: 'ሓድሽ ኪዳን'},
            detail: {en: 'Read the whole New Testament', ti: 'ምሉእ ሓድሽ ኪዳን ኣንብብ'},
            progress: countRead(newTestament, input.readChapters),
            goal: Math.max(1, chapterTotal(newTestament))
        },
        {
            id: 'scribe',
            icon: 'edit_note',
            title: {en: 'Scribe', ti: 'ጸሓፊ'},
            detail: {en: 'Write 10 reflection notes', ti: '10 መዘኻኸሪታት ጽሓፍ'},
            progress: input.notes,
            goal: 10
        },
        {
            id: 'illuminator',
            icon: 'highlighter',
            title: {en: 'Illuminator', ti: 'ኣብራሂ'},
            detail: {en: 'Highlight 25 verses', ti: '25 ጥቕስታት ኣብርህ'},
            progress: input.highlights,
            goal: 25
        },
        {
            id: 'finisher',
            icon: 'trophy',
            title: {en: 'Finisher', ti: 'ዛዛሚ'},
            detail: {en: 'Complete a reading plan', ti: 'ሓደ መደብ ንባብ ዛዝም'},
            progress: input.completedPlans,
            goal: 1
        }
    ];

    return defs.map(def => ({
        id: def.id,
        icon: def.icon,
        title: pick(def.title, language),
        detail: pick(def.detail, language),
        progress: Math.min(def.progress, def.goal),
        goal: def.goal,
        earned: def.progress >= def.goal
    }));
};

const startOfWeek = (now = new Date()) => {
    const date = new Date(now);
    const offset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - offset);
    return dayKey(date);
};

export const buildQuests = (input: GrowthInput, language: UiLanguage, notesThisWeek: number): Quest[] => {
    const today = dayKey();
    const weekStart = startOfWeek();
    const weekChapters = Object.entries(input.log)
        .filter(([day]) => day >= weekStart && day <= today)
        .reduce((sum, [, keys]) => sum + keys.length, 0);

    const defs: Array<{id: string; title: Localized; detail: Localized; progress: number; goal: number}> = [
        {
            id: 'daily-chapter',
            title: {en: "Today's chapter", ti: 'ናይ ሎሚ ምዕራፍ'},
            detail: {en: 'Read at least one chapter today', ti: 'ሎሚ እንተወሓደ ሓደ ምዕራፍ ኣንብብ'},
            progress: input.log[today]?.length ?? 0,
            goal: 1
        },
        {
            id: 'weekly-seven',
            title: {en: 'Seven this week', ti: 'ሸውዓተ ኣብዚ ሰሙን'},
            detail: {en: 'Read 7 chapters this week', ti: 'ኣብዚ ሰሙን 7 ምዕራፋት ኣንብብ'},
            progress: weekChapters,
            goal: 7
        },
        {
            id: 'weekly-reflection',
            title: {en: 'Reflect', ti: 'ኣስተንትን'},
            detail: {en: 'Write a reflection note this week', ti: 'ኣብዚ ሰሙን ሓደ መዘኻኸሪ ጽሓፍ'},
            progress: notesThisWeek,
            goal: 1
        }
    ];

    return defs.map(def => ({
        id: def.id,
        title: pick(def.title, language),
        detail: pick(def.detail, language),
        progress: Math.min(def.progress, def.goal),
        goal: def.goal
    }));
};

export const weekStartKey = startOfWeek;
