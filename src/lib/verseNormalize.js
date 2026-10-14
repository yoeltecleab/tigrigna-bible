// Plain ESM so the build-time content generator (Node) and the app share one implementation.
//
// In the source data `verseid` is only a row index. The printed verse number lives at the
// start of `versetext` ("16 …", "14-15 …", "[44 …"), and combined verses shift every
// following row, so the text prefix is the authoritative verse label.

const PREFIX = /^\s*(\[?)\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?\s*[.:)]?\s+(.*)$/su;
const LINE_BREAK = /\s*<br\s*\/?>\s*/giu;
const STRAY_TAG = /<[^>]+>/gu;
const WHITESPACE = /[ \t\u00a0]{2,}/gu;

/** @param {string} text */
export const cleanVerseText = text =>
    String(text ?? '')
        .replace(LINE_BREAK, '\n')
        .replace(STRAY_TAG, '')
        .replace(WHITESPACE, ' ')
        .trim();

/**
 * @param {string} rawText
 * @returns {{start: number, end: number, body: string} | null}
 */
export const parseVersePrefix = rawText => {
    const match = cleanVerseText(rawText).match(PREFIX);
    if (!match) {
        return null;
    }
    const first = Number(match[2]);
    const second = match[3] ? Number(match[3]) : first;
    const body = `${match[1]}${match[4]}`.trim();
    if (!Number.isFinite(first) || first < 1 || !body) {
        return null;
    }
    return {start: Math.min(first, second), end: Math.max(first, second), body};
};

/**
 * Normalizes every verse row of a chapter, in order.
 * Rows without a printed number continue from the previous verse.
 *
 * @param {Array<{verseid?: number, versetext?: string}>} rows
 * @returns {Array<{row: number, start: number, end: number, label: string, text: string}>}
 */
export const normalizeChapterVerses = rows => {
    const verses = [];
    let previousEnd = 0;
    for (const row of rows) {
        if (typeof row?.verseid !== 'number' || typeof row?.versetext !== 'string') {
            continue;
        }
        const parsed = parseVersePrefix(row.versetext);
        const start = parsed ? parsed.start : previousEnd > 0 ? previousEnd + 1 : row.verseid;
        const end = parsed ? parsed.end : start;
        const text = parsed ? parsed.body : cleanVerseText(row.versetext);
        previousEnd = end;
        verses.push({
            row: row.verseid,
            start,
            end,
            label: start === end ? String(start) : `${start}-${end}`,
            text
        });
    }
    return verses;
};

/**
 * Search-shard entries for one chapter (the same shape the generator writes to disk).
 *
 * @param {string} bookId
 * @param {number} chapter
 * @param {Array<unknown>} rows
 */
export const chapterSearchEntries = (bookId, chapter, rows) =>
    normalizeChapterVerses(rows).map(verse => ({
        key: `${bookId}:${chapter}:${verse.row}`,
        bookId,
        chapter,
        verse: verse.start,
        label: verse.label,
        text: verse.text
    }));

/**
 * Display label + clean text for a single stored verse (saved items written by older builds
 * may still carry the printed number inside the text).
 *
 * @param {{verse: number, text: string, label?: string}} item
 */
export const describeStoredVerse = item => {
    const parsed = parseVersePrefix(item.text);
    if (item.label) {
        return {label: item.label, text: parsed ? parsed.body : cleanVerseText(item.text)};
    }
    if (parsed) {
        return {
            label: parsed.start === parsed.end ? String(parsed.start) : `${parsed.start}-${parsed.end}`,
            text: parsed.body
        };
    }
    return {label: String(item.verse), text: cleanVerseText(item.text)};
};
