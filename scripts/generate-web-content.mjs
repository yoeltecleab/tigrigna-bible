import fs from 'node:fs';
import path from 'node:path';
import {chapterSearchEntries} from '../src/lib/verseNormalize.js';

const root = process.cwd();
const contentRoot = path.join(root, 'public', 'content');

const ENGLISH_NAME_FIXES = {
    Deuternomy: 'Deuteronomy',
    Nehmiah: 'Nehemiah',
    Pslams: 'Psalms',
    'Maccabess': 'Maccabees',
    '2 Maccabess': '2 Maccabees',
    Lemantations: 'Lamentations',
    james: 'James',
    '2 corinthians': '2 Corinthians'
};

// Well-loved passages for the rotating daily verse (Hebrew Psalm numbering, as in the source text).
const DAILY_VERSES = [
    ['JONE', 3, 16], ['DAWIT', 23, 1], ['ISEYAS', 41, 10], ['ERMIYAS', 29, 11], ['ROMA', 8, 28],
    ['FLIPSYOS', 4, 13], ['MSALIE', 3, 5], ['MATIEWOS', 11, 28], ['IYASU', 1, 9], ['DAWIT', 46, 1],
    ['ROMA', 12, 2], ['GELATYA', 5, 22], ['EFIESON', 2, 8], ['OBRAWIAN', 11, 1], ['1CHORONTOS', 13, 4],
    ['DAWIT', 119, 105], ['MATIEWOS', 6, 33], ['JONE', 14, 6], ['2TIMOTI', 1, 7], ['ISEYAS', 40, 31],
    ['DAWIT', 27, 1], ['DAWIT', 91, 1], ['JACOB', 1, 5], ['1PIETER', 5, 7], ['ROMA', 15, 13],
    ['FLIPSYOS', 4, 6], ['MATIEWOS', 5, 9], ['JONE', 1, 1], ['ZEFTRET', 1, 1], ['DAWIT', 37, 4],
    ['MSALIE', 18, 10], ['ISEYAS', 26, 3], ['LUKAS', 1, 37], ['MATIEWOS', 19, 26], ['JONE', 16, 33],
    ['ROMA', 5, 8], ['2CHORONTOS', 5, 17], ['EFIESON', 3, 20], ['COLASIYAS', 3, 23], ['1TESELONQIE', 5, 16],
    ['OBRAWIAN', 13, 8], ['1MJONE', 4, 19], ['1MJONE', 1, 9], ['DAWIT', 34, 8], ['DAWIT', 103, 1],
    ['DAWIT', 121, 1], ['MATIEWOS', 5, 14], ['JONE', 8, 12], ['JONE', 15, 5], ['ROMA', 10, 9],
    ['MIKYAS', 6, 8], ['DERMIYAS', 3, 22], ['ZEDAGM', 31, 6], ['DAWIT', 139, 14], ['MSALIE', 16, 3],
    ['MATIEWOS', 28, 20], ['GELATYA', 2, 20], ['2CHORONTOS', 12, 9], ['JACOB', 4, 8], ['RJONE', 21, 4]
];

const filenameToRef = fileName => {
    const match = fileName.replace(/\.json$/i, '').match(/^(.*?)(\d+)$/);
    return match ? {bookId: match[1], chapter: Number(match[2])} : null;
};

const normalizeBook = (book, testament, order) => {
    const engname = String(book.engname).trim();
    return {
        id: String(book.id),
        title: String(book.title).trim(),
        engname: ENGLISH_NAME_FIXES[engname] ?? engname,
        chaptersNum: Number(book.ChaptersNum),
        testament,
        order
    };
};

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').replace(/^[\u0000-\u001F]+/, ''));

const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value), 'utf8');

const languageDirs = fs
    .readdirSync(contentRoot)
    .filter(item => fs.statSync(path.join(contentRoot, item)).isDirectory() && item !== 'intro');

for (const lang of languageDirs) {
    const langDir = path.join(contentRoot, lang);
    const booksDir = path.join(langDir, 'book');
    if (!fs.existsSync(booksDir)) {
        continue;
    }

    const oldBooks = readJson(path.join(langDir, 'oldtestibooks.json'));
    const newBooks = readJson(path.join(langDir, 'newtestibooks.json'));
    const books = [
        ...oldBooks.map((book, index) => normalizeBook(book, 'old', index + 1)),
        ...newBooks.map((book, index) => normalizeBook(book, 'new', oldBooks.length + index + 1))
    ];

    const shards = new Map(books.map(book => [book.id, []]));
    const bundles = new Map(books.map(book => [book.id, []]));
    const readerIndex = [];
    const invalidFiles = [];
    let verseCount = 0;

    const fileNames = fs
        .readdirSync(booksDir)
        .filter(file => file.endsWith('.json'))
        .map(fileName => ({fileName, ref: filenameToRef(fileName)}))
        .filter(item => item.ref && shards.has(item.ref.bookId))
        .sort((left, right) => left.ref.chapter - right.ref.chapter);

    for (const {fileName, ref} of fileNames) {
        let raw;
        try {
            raw = readJson(path.join(booksDir, fileName));
        } catch (error) {
            invalidFiles.push({fileName, error: error instanceof Error ? error.message : String(error)});
            continue;
        }

        const rows = Array.isArray(raw.chapters) ? raw.chapters : [];
        bundles.get(ref.bookId).push({chapter: ref.chapter, file: raw});

        const verses = chapterSearchEntries(ref.bookId, ref.chapter, rows);
        verseCount += verses.length;
        shards.get(ref.bookId).push(...verses);

        const picks = new Set([0, Math.floor((verses.length - 1) / 2), verses.length - 1]);
        for (const index of picks) {
            if (verses[index]) {
                readerIndex.push(verses[index]);
            }
        }
    }

    const shardsDir = path.join(langDir, 'search-shards');
    const bundlesDir = path.join(langDir, 'bundles');
    fs.mkdirSync(shardsDir, {recursive: true});
    fs.mkdirSync(bundlesDir, {recursive: true});
    for (const [bookId, verses] of shards) {
        writeJson(path.join(shardsDir, `${bookId}.generated.json`), verses);
    }
    for (const [bookId, chapters] of bundles) {
        writeJson(path.join(bundlesDir, `${bookId}.generated.json`), {bookId, chapters});
    }

    const verseAt = (bookId, chapter, verse) =>
        shards.get(bookId)?.find(item => item.chapter === chapter && item.verse <= verse && verse <= Number(item.label.split('-').pop()));
    const dailyVerses = [];
    for (const [bookId, chapter, verse] of DAILY_VERSES) {
        const found = verseAt(bookId, chapter, verse);
        if (found) {
            dailyVerses.push(found);
        } else {
            console.warn(`[${lang}] daily verse not found: ${bookId} ${chapter}:${verse}`);
        }
    }

    const legacyMonolith = path.join(langDir, 'searchIndex.generated.json');
    if (fs.existsSync(legacyMonolith)) {
        fs.unlinkSync(legacyMonolith);
    }

    writeJson(path.join(langDir, 'books.generated.json'), books);
    writeJson(path.join(langDir, 'readerIndex.generated.json'), readerIndex);
    writeJson(path.join(langDir, 'dailyVerses.generated.json'), dailyVerses);
    writeJson(path.join(langDir, 'dailyVerse.generated.json'), dailyVerses[0] ?? null);

    console.log(
        `[${lang}] ${books.length} books, ${shards.size} shards, ${bundles.size} bundles, ${verseCount} verses, ${dailyVerses.length} daily verses`
    );
    if (invalidFiles.length > 0) {
        console.warn(`[${lang}] skipped ${invalidFiles.length} malformed files`, invalidFiles);
    }
}
