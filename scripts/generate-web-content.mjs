import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contentRoot = path.join(root, 'public', 'content');

const filenameToRef = fileName => {
    const base = fileName.replace(/\.json$/i, '');
    const match = base.match(/^(.*?)(\d+)$/);
    if (!match) {
        return null;
    }

    return {
        bookId: match[1],
        chapter: Number(match[2])
    };
};

const normalizeBook = (book, testament, order) => ({
    id: String(book.id),
    title: String(book.title),
    engname: String(book.engname),
    chaptersNum: Number(book.ChaptersNum),
    testament,
    order
});

const languageDirs = fs.readdirSync(contentRoot).filter(item => {
    const full = path.join(contentRoot, item);
    return fs.statSync(full).isDirectory() && item !== 'intro';
});

for (const lang of languageDirs) {
    const langDir = path.join(contentRoot, lang);
    const booksDir = path.join(langDir, 'book');
    if (!fs.existsSync(booksDir)) {
        continue;
    }

    const oldBooks = JSON.parse(fs.readFileSync(path.join(langDir, 'oldtestibooks.json'), 'utf8'));
    const newBooks = JSON.parse(fs.readFileSync(path.join(langDir, 'newtestibooks.json'), 'utf8'));

    const books = [
        ...oldBooks.map((book, index) => normalizeBook(book, 'old', index + 1)),
        ...newBooks.map((book, index) => normalizeBook(book, 'new', oldBooks.length + index + 1))
    ];

    const files = fs.readdirSync(booksDir).filter(file => file.endsWith('.json'));
    const searchIndex = [];
    const searchByBook = new Map();
    const readerIndex = [];
    const invalidFiles = [];

    for (const fileName of files) {
        const ref = filenameToRef(fileName);
        if (!ref) {
            continue;
        }

        let raw;
        try {
            const text = fs
                .readFileSync(path.join(booksDir, fileName), 'utf8')
                .replace(/^\uFEFF/, '')
                .replace(/^[\u0000-\u001F]+/, '');
            raw = JSON.parse(text);
        } catch (error) {
            invalidFiles.push({fileName, error: error instanceof Error ? error.message : String(error)});
            continue;
        }

        const chapterData = Array.isArray(raw.chapters) ? raw.chapters : [];
        const verseRows = chapterData.filter(row => typeof row?.verseid === 'number' && typeof row?.versetext === 'string');

        for (const row of chapterData) {
            if (typeof row?.verseid === 'number' && typeof row?.versetext === 'string') {
                const verseEntry = {
                    key: `${ref.bookId}:${ref.chapter}:${row.verseid}`,
                    bookId: ref.bookId,
                    chapter: ref.chapter,
                    verse: row.verseid,
                    text: row.versetext
                };

                searchIndex.push(verseEntry);
                if (!searchByBook.has(ref.bookId)) {
                    searchByBook.set(ref.bookId, []);
                }
                searchByBook.get(ref.bookId).push(verseEntry);
            }
        }

        if (verseRows.length > 0) {
            const sampleIndexes = [0, Math.floor((verseRows.length - 1) / 2), verseRows.length - 1];
            const picked = new Set();

            for (const idx of sampleIndexes) {
                const row = verseRows[idx];
                if (!row || picked.has(row.verseid)) {
                    continue;
                }

                picked.add(row.verseid);
                readerIndex.push({
                    key: `${ref.bookId}:${ref.chapter}:${row.verseid}`,
                    bookId: ref.bookId,
                    chapter: ref.chapter,
                    verse: row.verseid,
                    text: row.versetext
                });
            }
        }
    }

    const dailyVerse = searchIndex.length > 0 ? searchIndex[0] : null;
    const shardsDir = path.join(langDir, 'search-shards');
    fs.mkdirSync(shardsDir, {recursive: true});
    for (const [bookId, verses] of searchByBook.entries()) {
        const shardFile = `${bookId}.generated.json`;
        fs.writeFileSync(path.join(shardsDir, shardFile), JSON.stringify(verses), 'utf8');
    }

    fs.writeFileSync(path.join(langDir, 'books.generated.json'), JSON.stringify(books), 'utf8');
    fs.writeFileSync(path.join(langDir, 'searchIndex.generated.json'), JSON.stringify(searchIndex), 'utf8');
    fs.writeFileSync(path.join(langDir, 'readerIndex.generated.json'), JSON.stringify(readerIndex), 'utf8');
    fs.writeFileSync(path.join(langDir, 'dailyVerse.generated.json'), JSON.stringify(dailyVerse), 'utf8');

    console.log(`[${lang}] generated ${books.length} books and ${searchIndex.length} searchable verses`);
    if (invalidFiles.length > 0) {
        console.warn(`[${lang}] skipped ${invalidFiles.length} malformed files`);
    }
}
