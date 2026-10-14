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

/** @deprecated Monolith search index removed; prefer search worker shards. */
export const loadSearchIndex = async (language: string): Promise<SearchVerse[]> => {
    const cached = searchIndexCache.get(language);
    if (cached) {
        return cached;
    }

    // Fall back to reader sample index if a legacy monolith is absent.
    const request = (async () => {
        try {
            return await fetchJson<SearchVerse[]>(`/content/${language}/searchIndex.generated.json`);
        } catch {
            return loadReaderIndex(language);
        }
    })();
    searchIndexCache.set(language, request);
    return request;
};

export const resolveDailyVerse = async (language: string): Promise<SearchVerse | null> => {
    const seeded = await loadDailyVerse(language);
    const index = await loadReaderIndex(language);
    if (index.length === 0) {
        return seeded;
    }

    const dayBucket = Math.floor(Date.now() / 86_400_000);
    return index[dayBucket % index.length] ?? seeded;
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

    // Ethiopic syllables are often 1–2 code points; keep short tokens.
    const tokens = value
        .toLocaleLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .map(token => token.trim())
        .filter(token => token.length >= 2)
        .slice(0, 32);

    tokenCache.set(value, tokens);
    return tokens;
};

/** Distinctive tokens for worker-backed related search. */
export const buildRelatedQuery = (text: string, maxTokens = 4): string => {
    const tokens = tokenize(text);
    if (tokens.length === 0) {
        return '';
    }

    const ranked = [...tokens].sort((left, right) => {
        if (right.length !== left.length) {
            return right.length - left.length;
        }
        return left.localeCompare(right);
    });

    const unique: string[] = [];
    for (const token of ranked) {
        if (!unique.includes(token)) {
            unique.push(token);
        }
        if (unique.length >= maxTokens) {
            break;
        }
    }

    return unique.join(' ');
};

export const getRelatedVerses = (
    source: {bookId: string; chapter: number; verse: number; text: string},
    searchIndex: SearchVerse[],
    limit = 8
): SearchVerse[] => {
    const baseTokens = tokenize(source.text);
    if (baseTokens.length === 0) {
        return [];
    }

    const baseTokenSet = new Set(baseTokens);
    const sourceKey = `${source.bookId}:${source.chapter}:${source.verse}`;
    const documentFrequency = new Map<string, number>();

    for (const item of searchIndex) {
        const seen = new Set(tokenize(item.text));
        for (const token of seen) {
            if (baseTokenSet.has(token)) {
                documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
            }
        }
    }

    const corpusSize = Math.max(1, searchIndex.length);

    return searchIndex
        .filter(item => item.key !== sourceKey)
        .map(item => {
            const tokens = tokenize(item.text);
            let score = 0;
            let overlap = 0;
            for (const token of tokens) {
                if (!baseTokenSet.has(token)) {
                    continue;
                }
                overlap += 1;
                const df = documentFrequency.get(token) ?? 1;
                const idf = Math.log(1 + corpusSize / df);
                score += idf * Math.min(3, token.length / 2);
            }

            if (item.bookId !== source.bookId) {
                score *= 1.15;
            } else if (item.chapter !== source.chapter) {
                score *= 1.05;
            }

            return {item, overlap, score};
        })
        .filter(row => row.overlap >= (baseTokens.length >= 4 ? 2 : 1) && row.score > 0)
        .sort((left, right) => {
            if (right.score !== left.score) {
                return right.score - left.score;
            }
            if (right.overlap !== left.overlap) {
                return right.overlap - left.overlap;
            }
            return left.item.key.localeCompare(right.item.key);
        })
        .slice(0, limit)
        .map(row => row.item);
};

export const mergeRelatedVerses = (
    primary: SearchVerse[],
    secondary: SearchVerse[],
    sourceKey: string,
    limit = 8
): SearchVerse[] => {
    const seen = new Set<string>([sourceKey]);
    const merged: SearchVerse[] = [];
    for (const item of [...primary, ...secondary]) {
        if (seen.has(item.key)) {
            continue;
        }
        seen.add(item.key);
        merged.push(item);
        if (merged.length >= limit) {
            break;
        }
    }
    return merged;
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
