export type NormalizedVerse = {
    row: number;
    start: number;
    end: number;
    label: string;
    text: string;
};

export declare const cleanVerseText: (text: string) => string;

export declare const parseVersePrefix: (rawText: string) => {start: number; end: number; body: string} | null;

export declare const normalizeChapterVerses: (rows: ReadonlyArray<unknown>) => NormalizedVerse[];

export declare const chapterSearchEntries: (
    bookId: string,
    chapter: number,
    rows: ReadonlyArray<unknown>
) => Array<{key: string; bookId: string; chapter: number; verse: number; label: string; text: string}>;

export declare const describeStoredVerse: (item: {verse: number; text: string; label?: string}) => {
    label: string;
    text: string;
};
