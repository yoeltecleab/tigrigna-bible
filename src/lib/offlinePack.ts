import type {Book, BookBundle} from '../types/bible';
import {chapterSearchEntries} from './verseNormalize.js';

/** Must match the runtime-caching cacheName in vite.config.ts. */
export const CONTENT_CACHE = 'bible-content-cache';

const CONCURRENCY = 6;

export type OfflineProgress = {
    done: number;
    total: number;
};

export type OfflineInventory = {
    chaptersCached: number;
    chaptersTotal: number;
    shardsCached: number;
    shardsTotal: number;
    ready: boolean;
};

const indexFiles = (language: string) => [
    `/content/${language}/books.generated.json`,
    `/content/${language}/dailyVerses.generated.json`,
    `/content/${language}/readerIndex.generated.json`
];

const chapterUrl = (language: string, bookId: string, chapter: number) => `/content/${language}/book/${bookId}${chapter}.json`;
const shardUrl = (language: string, bookId: string) => `/content/${language}/search-shards/${bookId}.generated.json`;
const bundleUrl = (language: string, bookId: string) => `/content/${language}/bundles/${bookId}.generated.json`;

const jsonResponse = (value: unknown) =>
    new Response(JSON.stringify(value), {
        status: 200,
        headers: {'Content-Type': 'application/json; charset=utf-8'}
    });

const cachedPaths = async (cache: Cache) => {
    const keys = await cache.keys();
    return new Set(
        keys.map(request => {
            try {
                return new URL(request.url).pathname;
            } catch {
                return request.url;
            }
        })
    );
};

export const countOfflineInventory = async (language: string, books: Book[]): Promise<OfflineInventory> => {
    const chaptersTotal = books.reduce((sum, book) => sum + book.chaptersNum, 0);
    const shardsTotal = books.length;
    if (!('caches' in window)) {
        return {chaptersCached: 0, chaptersTotal, shardsCached: 0, shardsTotal, ready: false};
    }

    const paths = await cachedPaths(await caches.open(CONTENT_CACHE));
    let chaptersCached = 0;
    let shardsCached = 0;
    for (const book of books) {
        if (paths.has(shardUrl(language, book.id))) shardsCached += 1;
        for (let chapter = 1; chapter <= book.chaptersNum; chapter += 1) {
            if (paths.has(chapterUrl(language, book.id, chapter))) chaptersCached += 1;
        }
    }

    return {
        chaptersCached,
        chaptersTotal,
        shardsCached,
        shardsTotal,
        ready: books.length > 0 && chaptersCached >= chaptersTotal && shardsCached >= shardsTotal
    };
};

const fetchOk = async (url: string, signal?: AbortSignal) => {
    const response = await fetch(url, {credentials: 'same-origin', signal});
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return response;
};

/** Older deployments have no bundles; fall back to fetching each chapter file. */
const loadBundle = async (language: string, book: Book, signal?: AbortSignal): Promise<BookBundle> => {
    try {
        return (await (await fetchOk(bundleUrl(language, book.id), signal)).json()) as BookBundle;
    } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') throw error;
        const chapters = await Promise.all(
            Array.from({length: book.chaptersNum}, async (_, index) => ({
                chapter: index + 1,
                file: await (await fetchOk(chapterUrl(language, book.id, index + 1), signal)).json()
            }))
        );
        return {bookId: book.id, chapters};
    }
};

const storeBook = async (cache: Cache, language: string, book: Book, signal?: AbortSignal) => {
    const bundle = await loadBundle(language, book, signal);
    const shard = [];
    for (const {chapter, file} of bundle.chapters) {
        await cache.put(chapterUrl(language, book.id, chapter), jsonResponse(file));
        shard.push(...chapterSearchEntries(book.id, chapter, Array.isArray(file?.chapters) ? file.chapters : []));
    }
    await cache.put(shardUrl(language, book.id), jsonResponse(shard));
};

export const requestPersistentStorage = async () => {
    try {
        if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
        return (await navigator.storage?.persist?.()) ?? false;
    } catch {
        return false;
    }
};

export const estimateStorageMb = async (): Promise<string | null> => {
    try {
        const estimate = await navigator.storage?.estimate?.();
        return estimate?.usage != null ? (estimate.usage / 1024 / 1024).toFixed(1) : null;
    } catch {
        return null;
    }
};

export const downloadOfflinePack = async (
    language: string,
    books: Book[],
    onProgress?: (progress: OfflineProgress) => void,
    signal?: AbortSignal
): Promise<OfflineInventory> => {
    if (!('caches' in window)) {
        throw new Error('Cache API unavailable');
    }

    void requestPersistentStorage();
    const cache = await caches.open(CONTENT_CACHE);
    const paths = await cachedPaths(cache);
    const pending = books.filter(book => {
        if (!paths.has(shardUrl(language, book.id))) return true;
        for (let chapter = 1; chapter <= book.chaptersNum; chapter += 1) {
            if (!paths.has(chapterUrl(language, book.id, chapter))) return true;
        }
        return false;
    });

    const indexes = indexFiles(language).filter(url => !paths.has(url));
    const total = pending.length + indexes.length;
    let done = 0;
    const tick = () => {
        done += 1;
        onProgress?.({done, total});
    };
    onProgress?.({done, total});

    for (const url of indexes) {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        try {
            await cache.put(url, await fetchOk(url, signal));
        } catch (error) {
            if ((error as DOMException)?.name === 'AbortError') throw error;
        }
        tick();
    }

    const queue = [...pending];
    const failures: string[] = [];
    const worker = async () => {
        while (queue.length > 0) {
            if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
            const book = queue.shift()!;
            try {
                await storeBook(cache, language, book, signal);
            } catch (error) {
                if ((error as DOMException)?.name === 'AbortError') throw error;
                failures.push(book.id);
            }
            tick();
        }
    };
    await Promise.all(Array.from({length: Math.min(CONCURRENCY, queue.length)}, worker));

    const inventory = await countOfflineInventory(language, books);
    if (failures.length > 0 && !inventory.ready) {
        throw new Error(`Failed books: ${failures.join(', ')}`);
    }
    return inventory;
};
