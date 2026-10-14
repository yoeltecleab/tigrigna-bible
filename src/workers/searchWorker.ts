import type {SearchVerse} from '../types/bible';

type SearchRequest = {
    type: 'search';
    requestId: number;
    language: string;
    query: string;
    /** Canonically ordered book ids to search. */
    books: string[];
    exactPhrase?: boolean;
    limit?: number;
};

export type ScoredVerse = SearchVerse & {score: number};

export type SearchResponse = {
    type: 'results';
    requestId: number;
    results: ScoredVerse[];
    total: number;
    capped: boolean;
};

const shardCache = new Map<string, Promise<SearchVerse[]>>();
const SHARD_BATCH = 12;
const MAX_MATCHES = 2000;
const WORD_EDGE = /[^\p{L}\p{M}\p{N}]/u;

const fetchShard = (language: string, bookId: string): Promise<SearchVerse[]> => {
    const key = `${language}:${bookId}`;
    const cached = shardCache.get(key);
    if (cached) {
        return cached;
    }
    const request = fetch(`/content/${language}/search-shards/${bookId}.generated.json`)
        .then(res => (res.ok ? (res.json() as Promise<SearchVerse[]>) : []))
        .catch(() => {
            shardCache.delete(key);
            return [] as SearchVerse[];
        });
    shardCache.set(key, request);
    return request;
};

const occurrences = (haystack: string, needle: string) => {
    let count = 0;
    let wholeWords = 0;
    let index = haystack.indexOf(needle);
    while (index !== -1) {
        count += 1;
        const before = index === 0 ? ' ' : haystack[index - 1];
        const after = haystack[index + needle.length] ?? ' ';
        if (WORD_EDGE.test(before) && WORD_EDGE.test(after)) wholeWords += 1;
        index = haystack.indexOf(needle, index + needle.length);
    }
    return {count, wholeWords};
};

const scoreVerse = (text: string, phrase: string, tokens: string[], exactPhrase: boolean): number => {
    const haystack = text.toLocaleLowerCase();
    if (exactPhrase) {
        const hit = occurrences(haystack, phrase);
        return hit.count === 0 ? 0 : 10 + hit.wholeWords * 3 + hit.count;
    }

    let score = 0;
    for (const token of tokens) {
        const hit = occurrences(haystack, token);
        if (hit.count === 0) return 0;
        score += hit.count + hit.wholeWords * 2;
    }
    if (tokens.length > 1 && haystack.includes(phrase)) score += 8;
    return score + 2 * (1 - Math.min(text.length, 400) / 400);
};

self.onmessage = async (event: MessageEvent<SearchRequest>) => {
    if (event.data.type !== 'search') {
        return;
    }

    const {requestId, language, query, books, exactPhrase = false, limit = 400} = event.data;
    const phrase = query.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
    if (!phrase) {
        self.postMessage({type: 'results', requestId, results: [], total: 0, capped: false} satisfies SearchResponse);
        return;
    }

    const tokens = [...new Set(phrase.split(' ').filter(Boolean))];
    const matches: ScoredVerse[] = [];
    let total = 0;

    for (let offset = 0; offset < books.length; offset += SHARD_BATCH) {
        const shards = await Promise.all(books.slice(offset, offset + SHARD_BATCH).map(bookId => fetchShard(language, bookId)));
        for (const shard of shards) {
            for (const verse of shard) {
                const score = scoreVerse(verse.text, phrase, tokens, exactPhrase);
                if (score > 0) {
                    total += 1;
                    if (matches.length < MAX_MATCHES) matches.push({...verse, score});
                }
            }
        }
    }

    const ranked = [...matches].sort((left, right) => right.score - left.score).slice(0, limit);
    const response: SearchResponse = {
        type: 'results',
        requestId,
        results: ranked,
        total,
        capped: total > ranked.length
    };
    self.postMessage(response);
};
