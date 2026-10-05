import {Book, ChapterFile, SearchVerse} from '../types/bible';

const tokenCache = new Map<string, string[]>();
const booksCache = new Map<string, Promise<Book[]>>();
const searchIndexCache = new Map<string, Promise<SearchVerse[]>>();
const readerIndexCache = new Map<string, Promise<SearchVerse[]>>();
const dailyVerseCache = new Map<string, Promise<SearchVerse | null>>();
const chapterCache = new Map<string, Promise<ChapterFile | null>>();

type RawBook = {
    id: string | number;
    title: string;
    engname: string;
    ChaptersNum: string | number;
};

const toBooks = (oldBooks: RawBook[], newBooks: RawBook[]): Book[] => {
    const normalize = (book: RawBook, testament: 'old' | 'new', order: number): Book => ({
        id: String(book.id),
        title: String(book.title),
        engname: String(book.engname),
        chaptersNum: Number(book.ChaptersNum),
        testament,
        order
    });

    return [
        ...oldBooks.map((book, idx) => normalize(book, 'old', idx + 1)),
        ...newBooks.map((book, idx) => normalize(book, 'new', oldBooks.length + idx + 1))
    ];
};

const fetchJson = async <T>(path: string): Promise<T> => {
    const res = await fetch(path);
    if (!res.ok) {
        throw new Error(`Failed to load ${path}`);
    }
    return (await res.json()) as T;
};

export const getAvailableLanguages = async (): Promise<string[]> => {
    // Keep this explicit for reliability in static hosting.
    return ['ti'];
};

export const loadBooks = async (language: string): Promise<Book[]> => {
    const cached = booksCache.get(language);
    if (cached) {
        return cached;
    }

    const request = (async () => {
        try {
            return await fetchJson<Book[]>(`/content/${language}/books.generated.json`);
        } catch {
            const [oldBooks, newBooks] = await Promise.all([
                fetchJson<RawBook[]>(`/content/${language}/oldtestibooks.json`),
                fetchJson<RawBook[]>(`/content/${language}/newtestibooks.json`)
            ]);
            return toBooks(oldBooks, newBooks);
        }
    })();

    booksCache.set(language, request);
    return request;
};

export const loadSearchIndex = async (language: string): Promise<SearchVerse[]> => {
    const cached = searchIndexCache.get(language);
    if (cached) {
        return cached;
    }

    const request = fetchJson<SearchVerse[]>(`/content/${language}/searchIndex.generated.json`);
    searchIndexCache.set(language, request);
    return request;
};

export const loadReaderIndex = async (language: string): Promise<SearchVerse[]> => {
    const cached = readerIndexCache.get(language);
    if (cached) {
        return cached;
    }

    const request = fetchJson<SearchVerse[]>(`/content/${language}/readerIndex.generated.json`);
    readerIndexCache.set(language, request);
    return request;
};

export const loadDailyVerse = async (language: string): Promise<SearchVerse | null> => {
    const cached = dailyVerseCache.get(language);
    if (cached) {
        return cached;
    }

    const request = fetchJson<SearchVerse | null>(`/content/${language}/dailyVerse.generated.json`);
    dailyVerseCache.set(language, request);
    return request;
};

export const loadChapterFile = async (language: string, bookId: string, chapter: number): Promise<ChapterFile | null> => {
    const cacheKey = `${language}:${bookId}:${chapter}`;
    const cached = chapterCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const filePath = `/content/${language}/book/${bookId}${chapter}.json`;
    const request = (async () => {
        try {
            return await fetchJson<ChapterFile>(filePath);
        } catch {
            return null;
        }
    })();

    chapterCache.set(cacheKey, request);
    return request;
};

const tokenize = (value: string) => {
    const cached = tokenCache.get(value);
    if (cached) {
        return cached;
    }

    const tokens = value
        .toLocaleLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .map(token => token.trim())
        .filter(token => token.length >= 3)
        .slice(0, 24);

    tokenCache.set(value, tokens);
    return tokens;
};

export const getRelatedVerses = (
    source: { bookId: string; chapter: number; verse: number; text: string },
    searchIndex: SearchVerse[],
    limit = 6
): SearchVerse[] => {
    const baseTokens = tokenize(source.text);
    if (baseTokens.length === 0) {
        return [];
    }

    const baseTokenSet = new Set(baseTokens);

    return searchIndex
        .filter(item => item.key !== `${source.bookId}:${source.chapter}:${source.verse}`)
        .map(item => {
            const tokens = tokenize(item.text);
            const overlap = tokens.filter(token => baseTokenSet.has(token)).length;
            return {item, overlap};
        })
        .filter(row => row.overlap > 0)
        .sort((left, right) => {
            if (right.overlap !== left.overlap) {
                return right.overlap - left.overlap;
            }
            return left.item.key.localeCompare(right.item.key);
        })
        .slice(0, limit)
        .map(row => row.item);
};

export const searchVerses = (
    query: string,
    searchIndex: SearchVerse[],
    bookFilter?: string,
    options?: { exactPhrase?: boolean; caseSensitive?: boolean }
): SearchVerse[] => {
    const trimmed = query.trim();
    if (!trimmed) {
        return [];
    }

    const exactPhrase = options?.exactPhrase ?? false;
    const caseSensitive = options?.caseSensitive ?? false;
    const normalizedQuery = caseSensitive ? trimmed : trimmed.toLocaleLowerCase();
    const queryTokens = exactPhrase
        ? [normalizedQuery]
        : normalizedQuery.split(/\s+/).map(token => token.trim()).filter(Boolean);

    return searchIndex
        .filter(verse => {
            if (bookFilter && verse.bookId !== bookFilter) {
                return false;
            }

            const haystack = caseSensitive ? verse.text : verse.text.toLocaleLowerCase();
            return queryTokens.every(token => haystack.includes(token));
        })
        .slice(0, 300);
};
