import {SearchVerse} from '../types/bible';

type SearchRequest = {
    type: 'search';
    requestId: number;
    language: string;
    query: string;
    bookFilter?: string;
    bookFilters?: string[];
    books: string[];
    exactPhrase?: boolean;
    caseSensitive?: boolean;
    limit?: number;
};

type SearchResponse = {
    type: 'results';
    requestId: number;
    results: SearchVerse[];
};

const shardCache = new Map<string, SearchVerse[]>();

const fetchShard = async (language: string, bookId: string): Promise<SearchVerse[]> => {
    const key = `${language}:${bookId}`;
    const cached = shardCache.get(key);
    if (cached) {
        return cached;
    }

    const res = await fetch(`/content/${language}/search-shards/${bookId}.generated.json`);
    if (!res.ok) {
        shardCache.set(key, []);
        return [];
    }

    const data = (await res.json()) as SearchVerse[];
    shardCache.set(key, data);
    return data;
};

const matches = (
    verse: SearchVerse,
    queryTokens: string[],
    caseSensitive: boolean,
    exactPhrase: boolean
): boolean => {
    const haystack = caseSensitive ? verse.text : verse.text.toLocaleLowerCase();
    if (exactPhrase) {
        return haystack.includes(queryTokens[0]);
    }

    return queryTokens.every(token => haystack.includes(token));
};

self.onmessage = async (event: MessageEvent<SearchRequest>) => {
    if (event.data.type !== 'search') {
        return;
    }

    const {
        requestId,
        language,
        query,
        bookFilter,
        bookFilters,
        books,
        exactPhrase = false,
        caseSensitive = false,
        limit = 300
    } = event.data;

    const trimmed = query.trim();
    if (!trimmed) {
        const response: SearchResponse = {type: 'results', requestId, results: []};
        self.postMessage(response);
        return;
    }

    const normalizedQuery = caseSensitive ? trimmed : trimmed.toLocaleLowerCase();
    const queryTokens = exactPhrase
        ? [normalizedQuery]
        : normalizedQuery.split(/\s+/).map(token => token.trim()).filter(Boolean);

    const scope = bookFilters && bookFilters.length > 0 ? bookFilters : bookFilter ? [bookFilter] : books;
    const results: SearchVerse[] = [];

    for (const bookId of scope) {
        const shard = await fetchShard(language, bookId);

        for (const verse of shard) {
            if (matches(verse, queryTokens, caseSensitive, exactPhrase)) {
                results.push(verse);
                if (results.length >= limit) {
                    const response: SearchResponse = {type: 'results', requestId, results};
                    self.postMessage(response);
                    return;
                }
            }
        }
    }

    const response: SearchResponse = {type: 'results', requestId, results};
    self.postMessage(response);
};
