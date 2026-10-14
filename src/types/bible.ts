export type Testament = 'old' | 'new';

export type Book = {
    id: string;
    title: string;
    engname: string;
    chaptersNum: number;
    testament: Testament;
    order: number;
};

export type Verse = {
    verseid: number;
    versetext: string;
};

export type Subtitle = {
    subtitle: string;
};

export type Subreference = {
    subreference: string;
};

export type ChapterRow = Verse | Subtitle | Subreference;

export type ChapterFile = {
    booktitle?: string;
    title?: string;
    chapters: ChapterRow[];
};

/** `key` is row-based (`BOOK:chapter:row`); `verse`/`label` are the printed verse numbers. */
export type SearchVerse = {
    key: string;
    bookId: string;
    chapter: number;
    verse: number;
    label?: string;
    text: string;
};

export type BookBundle = {
    bookId: string;
    chapters: {chapter: number; file: ChapterFile}[];
};

export const isVerse = (row: ChapterRow): row is Verse => {
    return typeof (row as Verse).verseid === 'number' && typeof (row as Verse).versetext === 'string';
};

export const isSubtitle = (row: ChapterRow): row is Subtitle => {
    return typeof (row as Subtitle).subtitle === 'string';
};

export const isSubreference = (row: ChapterRow): row is Subreference => {
    return typeof (row as Subreference).subreference === 'string';
};
