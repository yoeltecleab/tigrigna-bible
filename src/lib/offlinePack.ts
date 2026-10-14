import type {Book} from '../types/bible';

export const CONTENT_CACHE = 'bible-content-cache';
export const APP_ICONS_CACHE = 'app-icons-cache';

export type OfflineProgress = {
    done: number;
    total: number;
    label: string;
};

export type OfflineInventory = {
    chaptersCached: number;
    chaptersTotal: number;
    shardsCached: number;
    shardsTotal: number;
    indexesCached: number;
    indexesTotal: number;
    ready: boolean;
};

const INDEX_FILES = (language: string) => [
    `/content/${language}/books.generated.json`,
    `/content/${language}/readerIndex.generated.json`,
    `/content/${language}/dailyVerse.generated.json`,
    `/content/${language}/oldtestibooks.json`,
    `/content/${language}/newtestibooks.json`
];

export const buildOfflineUrls = (language: string, books: Book[]): string[] => {
    const urls: string[] = [...INDEX_FILES(language)];
    for (const book of books) {
        urls.push(`/content/${language}/search-shards/${book.id}.generated.json`);
        for (let chapter = 1; chapter <= book.chaptersNum; chapter += 1) {
            urls.push(`/content/${language}/book/${book.id}${chapter}.json`);
        }
    }
    return urls;
};

export const countOfflineInventory = async (language: string, books: Book[]): Promise<OfflineInventory> => {
    const chaptersTotal = books.reduce((sum, book) => sum + book.chaptersNum, 0);
    const shardsTotal = books.length;
    const indexesTotal = INDEX_FILES(language).length;

    let chaptersCached = 0;
    let shardsCached = 0;
    let indexesCached = 0;

    if (!('caches' in window)) {
        return {
            chaptersCached: 0,
            chaptersTotal,
            shardsCached: 0,
            shardsTotal,
            indexesCached: 0,
            indexesTotal,
            ready: false
        };
    }

    const cache = await caches.open(CONTENT_CACHE);
    const keys = await cache.keys();
    const paths = new Set(
        keys.map(request => {
            try {
                return new URL(request.url).pathname;
            } catch {
                return request.url;
            }
        })
    );

    for (const path of INDEX_FILES(language)) {
        if (paths.has(path)) {
            indexesCached += 1;
        }
    }

    for (const book of books) {
        if (paths.has(`/content/${language}/search-shards/${book.id}.generated.json`)) {
            shardsCached += 1;
        }
        for (let chapter = 1; chapter <= book.chaptersNum; chapter += 1) {
            if (paths.has(`/content/${language}/book/${book.id}${chapter}.json`)) {
                chaptersCached += 1;
            }
        }
    }

    const ready =
        chaptersCached >= chaptersTotal &&
        shardsCached >= shardsTotal &&
        indexesCached >= Math.max(1, indexesTotal - 2);

    return {
        chaptersCached,
        chaptersTotal,
        shardsCached,
        shardsTotal,
        indexesCached,
        indexesTotal,
        ready
    };
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

    const cache = await caches.open(CONTENT_CACHE);
    const urls = buildOfflineUrls(language, books);
    let done = 0;

    for (const url of urls) {
        if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        const existing = await cache.match(url);
        if (!existing) {
            const response = await fetch(url, {cache: 'force-cache', credentials: 'same-origin'});
            if (response.ok) {
                await cache.put(url, response.clone());
            }
        }

        done += 1;
        onProgress?.({
            done,
            total: urls.length,
            label: url.split('/').pop() ?? url
        });
    }

    return countOfflineInventory(language, books);
};
