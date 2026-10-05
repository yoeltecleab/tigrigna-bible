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

export type ChapterRow = Verse | Subtitle;

export type ChapterFile = {
    booktitle?: string;
    title?: string;
    chapters: ChapterRow[];
};

export type SearchVerse = {
    key: string;
    bookId: string;
    chapter: number;
    verse: number;
    text: string;
};

export const isVerse = (row: ChapterRow): row is Verse => {
    return typeof (row as Verse).verseid === 'number' && typeof (row as Verse).versetext === 'string';
};
