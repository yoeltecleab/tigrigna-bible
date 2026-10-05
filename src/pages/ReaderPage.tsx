import {useEffect, useMemo, useRef, useState} from 'react';
import {Link, useLocation, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {getRelatedVerses, loadBooks, loadChapterFile, loadReaderIndex} from '../data/api';
import {Book, ChapterRow, isVerse, SearchVerse} from '../types/bible';
import {useSettingsStore} from '../store/settingsStore';
import {useSavedStore} from '../store/savedStore';
import {buildSharePayload, readerShareUrl} from '../lib/site';

type ReaderLocationState = {
    targetVerse?: number;
    source?: 'search' | 'related';
};

type ParsedVerse = {
    start: number;
    end: number;
    label: string;
    text: string;
};

const parseVerseDisplay = (verseId: number, rawText: string): ParsedVerse => {
    const fallbackText = rawText.trim();
    const match = fallbackText.match(/^(\d+)(?:\s*[-–]\s*(\d+))?\s*(?:[).:]|-)?\s*(.+)$/u);

    if (!match || !match[3]) {
        return {
            start: verseId,
            end: verseId,
            label: String(verseId),
            text: fallbackText
        };
    }

    const first = Number(match[1]);
    const second = match[2] ? Number(match[2]) : first;
    const body = match[3].trim();

    if (!Number.isFinite(first) || !Number.isFinite(second) || !body) {
        return {
            start: verseId,
            end: verseId,
            label: String(verseId),
            text: fallbackText
        };
    }

    const start = Math.min(first, second);
    const end = Math.max(first, second);
    const isExpectedPrefix = verseId >= start && verseId <= end;

    if (!isExpectedPrefix) {
        return {
            start: verseId,
            end: verseId,
            label: String(verseId),
            text: fallbackText
        };
    }

    return {
        start,
        end,
        label: start === end ? String(start) : `${start}-${end}`,
        text: body
    };
};

export default function ReaderPage() {
    const {bookId = '', chapter = '1'} = useParams();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const numericChapter = Number(chapter);
    const language = useSettingsStore(state => state.language);
    const fontScale = useSettingsStore(state => state.fontScale);
    const setFontScale = useSettingsStore(state => state.setFontScale);
    const setLastReading = useSettingsStore(state => state.setLastReading);

    const [books, setBooks] = useState<Book[]>([]);
    const [bookTitle, setBookTitle] = useState(bookId);
    const [chapterCount, setChapterCount] = useState(1);
    const [chapterRows, setChapterRows] = useState<ChapterRow[]>([]);
    const [compareRows, setCompareRows] = useState<ChapterRow[]>([]);
    const [readerIndex, setReaderIndex] = useState<SearchVerse[]>([]);
    const [isLoadingChapter, setIsLoadingChapter] = useState(true);
    const [lineHeightScale, setLineHeightScale] = useState(1.75);
    const [compareMode, setCompareMode] = useState(false);
    const [showReaderTools, setShowReaderTools] = useState(false);
    const [showRelated, setShowRelated] = useState(false);
    const [showComparePanel, setShowComparePanel] = useState(false);
    const [compareBookId, setCompareBookId] = useState(bookId);
    const [compareChapter, setCompareChapter] = useState(numericChapter);
    const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);
    const [noteDraft, setNoteDraft] = useState('');
    const [newCollectionName, setNewCollectionName] = useState('');
    const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
    const touchStartX = useRef<number | null>(null);
    const highlightTimeout = useRef<number | null>(null);
    const lastJumpRef = useRef('');

    const toggleBookmark = useSavedStore(state => state.toggleBookmark);
    const toggleHighlight = useSavedStore(state => state.toggleHighlight);
    const notes = useSavedStore(state => state.notes);
    const collections = useSavedStore(state => state.collections);
    const createCollection = useSavedStore(state => state.createCollection);
    const addToCollection = useSavedStore(state => state.addToCollection);
    const removeFromCollection = useSavedStore(state => state.removeFromCollection);
    const upsertNote = useSavedStore(state => state.upsertNote);
    const removeNote = useSavedStore(state => state.removeNote);
    const isInCollection = useSavedStore(state => state.isInCollection);
    const isBookmarked = useSavedStore(state => state.isBookmarked);
    const isHighlighted = useSavedStore(state => state.isHighlighted);

    useEffect(() => {
        void loadBooks(language).then(books => {
            setBooks(books);
            const book = books.find(item => item.id === bookId);
            if (book) {
                setBookTitle(book.title);
                setChapterCount(book.chaptersNum);
            }
        });

        setIsLoadingChapter(true);
        void Promise.all([loadChapterFile(language, bookId, numericChapter), loadReaderIndex(language)]).then(([chapterFile, index]) => {
            setChapterRows(Array.isArray(chapterFile?.chapters) ? chapterFile!.chapters : []);
            setReaderIndex(index);
            setIsLoadingChapter(false);
        });
    }, [language, bookId, numericChapter]);

    useEffect(() => {
        setCompareBookId(bookId);
        setCompareChapter(numericChapter);
    }, [bookId, numericChapter]);

    useEffect(() => {
        if (!compareMode) {
            return;
        }

        void loadChapterFile(language, compareBookId, compareChapter).then(chapterFile => {
            setCompareRows(Array.isArray(chapterFile?.chapters) ? chapterFile!.chapters : []);
        });
    }, [language, compareMode, compareBookId, compareChapter]);

    useEffect(() => {
        if (!bookId || Number.isNaN(numericChapter)) {
            return;
        }

        setLastReading({
            bookId,
            chapter: numericChapter
        });
    }, [bookId, numericChapter, setLastReading]);

    useEffect(() => {
        const media = window.matchMedia('(min-width: 1000px)');
        const update = () => setCompareMode(media.matches);
        update();
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        return () => {
            if (highlightTimeout.current) {
                window.clearTimeout(highlightTimeout.current);
            }
        };
    }, []);

    const verses = useMemo(() => chapterRows.filter(isVerse), [chapterRows]);
    const compareVerses = useMemo(() => compareRows.filter(isVerse), [compareRows]);
    const booksMap = useMemo(() => new Map(books.map(book => [book.id, book])), [books]);
    const verseEntries = useMemo(
        () =>
            verses.map(verse => {
                const parsed = parseVerseDisplay(verse.verseid, verse.versetext);
                return {
                    key: `${bookId}:${numericChapter}:${verse.verseid}`,
                    verse,
                    ...parsed
                };
            }),
        [verses, bookId, numericChapter]
    );
    const compareVerseEntries = useMemo(
        () =>
            compareVerses.map(verse => {
                const parsed = parseVerseDisplay(verse.verseid, verse.versetext);
                return {
                    key: `parallel-${verse.verseid}`,
                    ...parsed
                };
            }),
        [compareVerses]
    );
    const noteKeySet = useMemo(() => new Set(notes.map(note => note.key)), [notes]);
    const selectedVerse = useMemo(() => verseEntries.find(entry => entry.key === selectedVerseKey) ?? null, [verseEntries, selectedVerseKey]);
    const selectedVerseNote = useMemo(
        () => (selectedVerseKey ? notes.find(note => note.key === selectedVerseKey) ?? null : null),
        [notes, selectedVerseKey]
    );
    const selectedVerseCollections = selectedVerseKey
        ? collections.filter(collection => isInCollection(collection.id, selectedVerseKey))
        : [];

    useEffect(() => {
        setNoteDraft(selectedVerseNote?.note ?? '');
    }, [selectedVerseNote, selectedVerseKey]);

    const related = useMemo(() => {
        if (verseEntries.length === 0 || readerIndex.length === 0) {
            return [];
        }
        const anchor = verseEntries[Math.min(2, verseEntries.length - 1)];
        return getRelatedVerses(
            {bookId, chapter: numericChapter, verse: anchor.verse.verseid, text: anchor.text},
            readerIndex,
            5
        );
    }, [verseEntries, readerIndex, bookId, numericChapter]);

    useEffect(() => {
        const state = location.state as ReaderLocationState | null;
        const queryVerse = Number(searchParams.get('verse'));
        const targetVerse = state?.targetVerse ?? (Number.isFinite(queryVerse) ? queryVerse : undefined);

        if (!targetVerse || !Number.isFinite(targetVerse) || verseEntries.length === 0) {
            return;
        }

        const jumpId = `${bookId}:${numericChapter}:${targetVerse}`;
        if (lastJumpRef.current === jumpId) {
            return;
        }

        const targetEntry = verseEntries.find(entry => targetVerse >= entry.start && targetVerse <= entry.end);
        if (!targetEntry) {
            return;
        }

        const targetEl = document.querySelector<HTMLElement>(`[data-verse-key='${targetEntry.key}']`);
        if (!targetEl) {
            return;
        }

        lastJumpRef.current = jumpId;
        targetEl.scrollIntoView({behavior: 'smooth', block: 'center'});
        setHighlightedVerse(targetVerse);

        if (highlightTimeout.current) {
            window.clearTimeout(highlightTimeout.current);
        }

        highlightTimeout.current = window.setTimeout(() => {
            setHighlightedVerse(null);
        }, 5000);
    }, [location.state, searchParams, verseEntries, bookId, numericChapter]);

    const goToChapter = (target: number) => {
        const clamped = Math.max(1, Math.min(chapterCount, target));
        navigate(`/reader/${bookId}/${clamped}`);
    };

    const onTouchStart = (event: React.TouchEvent<HTMLElement>) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
    };

    const onTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
        if (touchStartX.current == null) {
            return;
        }

        const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
        const deltaX = endX - touchStartX.current;
        touchStartX.current = null;

        if (Math.abs(deltaX) < 56) {
            return;
        }

        if (deltaX < 0) {
            goToChapter(numericChapter + 1);
            return;
        }

        goToChapter(numericChapter - 1);
    };

    const applyCollection = (collectionId: string) => {
        if (!selectedVerse || !selectedVerseKey) {
            return;
        }

        if (isInCollection(collectionId, selectedVerseKey)) {
            removeFromCollection(collectionId, selectedVerseKey);
            return;
        }

        addToCollection(collectionId, {
            key: selectedVerseKey,
            bookId,
            chapter: numericChapter,
            verse: selectedVerse.verse.verseid,
            text: selectedVerse.text
        });
    };

    const createAndAttachCollection = () => {
        if (!selectedVerse || !selectedVerseKey || !newCollectionName.trim()) {
            return;
        }

        const collectionId = createCollection(newCollectionName);
        if (!collectionId) {
            return;
        }

        addToCollection(collectionId, {
            key: selectedVerseKey,
            bookId,
            chapter: numericChapter,
            verse: selectedVerse.verse.verseid,
            text: selectedVerse.text
        });
        setNewCollectionName('');
    };

    const compareBook = booksMap.get(compareBookId);
    const compareChapterCount = compareBook?.chaptersNum ?? 1;

    const shareSelectedVerse = async () => {
        if (!selectedVerse) {
            return;
        }

        const reference = `${bookTitle} ${numericChapter}:${selectedVerse.label}`;
        const url = readerShareUrl(bookId, numericChapter, selectedVerse.verse.verseid);
        const payload = buildSharePayload(reference, selectedVerse.text, url);

        try {
            if (navigator.share) {
                await navigator.share(payload);
                return;
            }

            if (navigator.clipboard) {
                await navigator.clipboard.writeText(payload.text);
            }
        } catch {
            // Ignore cancelled shares.
        }
    };

    const saveSelectedVerseNote = () => {
        if (!selectedVerse || !selectedVerseKey) {
            return;
        }

        upsertNote({
            key: selectedVerseKey,
            bookId,
            chapter: numericChapter,
            verse: selectedVerse.verse.verseid,
            text: selectedVerse.text,
            note: noteDraft
        });
    };

    const clearSelectedVerseNote = () => {
        if (!selectedVerseKey) {
            return;
        }

        removeNote(selectedVerseKey);
        setNoteDraft('');
    };

    return (
        <section className="stack-lg">
            <div className="reader-shell stack-lg">
                <header className="panel hero-panel reader-hero stack-sm">
                    <div className="section-header">
                        <div>
                            <p className="eyebrow">Immersive reader</p>
                            <h2>Compare mode</h2>
                            <p className="muted">
                                Parallel reading for {bookTitle}, chapter {numericChapter}.
                            </p>
                        </div>
                        <button
                            className={compareMode ? 'btn btn-primary' : 'btn'}
                            type="button"
                            onClick={() => setCompareMode(value => !value)}
                        >
                            {compareMode ? 'Dual pane on' : 'Dual pane off'}
                        </button>
                    </div>

                    <button
                        className="collapse-toggle"
                        type="button"
                        onClick={() => setShowReaderTools(value => !value)}
                        aria-expanded={showReaderTools}
                    >
                        Display settings
                        <span className="material-symbols-outlined">{showReaderTools ? 'expand_less' : 'expand_more'}</span>
                    </button>

                    {showReaderTools ? (
                        <div className="reader-settings-grid">
                            <label className="stack-xs reader-slider">
                                <span>Text size</span>
                                <input
                                    type="range"
                                    min={0.9}
                                    max={1.5}
                                    step={0.1}
                                    value={fontScale}
                                    onChange={event => setFontScale(Number(event.target.value))}
                                />
                            </label>
                            <label className="stack-xs reader-slider">
                                <span>Spacing</span>
                                <input
                                    type="range"
                                    min={1.4}
                                    max={2.2}
                                    step={0.1}
                                    value={lineHeightScale}
                                    onChange={event => setLineHeightScale(Number(event.target.value))}
                                />
                            </label>
                        </div>
                    ) : null}

                    <div className="row gap-sm wrap">
                        <Link className="btn" to={`/books/${bookId}`}>
                            Chapters
                        </Link>
                    </div>
                </header>

                <div
                    className={compareMode ? 'reader-grid reader-grid-compare paper-swipe reader-compare-wrap' : 'reader-grid paper-swipe'}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                >
                    <article className="panel stack-sm reader-pane verse-pane-main">
                        <header className="stack-xs">
                            <p className="eyebrow">TI ወንጌል</p>
                            <h3>
                                {bookTitle} {numericChapter}
                            </h3>
                            <p className="muted">Chapter {numericChapter} of {chapterCount}</p>
                        </header>

                        <div className="stack-sm verse-stack">
                            {isLoadingChapter &&
                                Array.from({length: 8}).map((_, index) => <div className="verse-row skeleton"
                                                                               key={`verse-skeleton-${index}`}/>)}
                            {verseEntries.map(verse => {
                                const hasCollection = collections.some(collection => isInCollection(collection.id, verse.key));
                                const hasNote = noteKeySet.has(verse.key);
                                return (
                                    <article
                                        className={
                                            highlightedVerse != null && highlightedVerse >= verse.start && highlightedVerse <= verse.end
                                                ? 'verse-row verse-row-highlighted'
                                                : 'verse-row'
                                        }
                                        key={verse.key}
                                        data-verse-key={verse.key}
                                        onClick={() => setSelectedVerseKey(verse.key)}
                                    >
                                        <span className="verse-number">{verse.label}</span>
                                        <p style={{fontSize: `${fontScale}rem`, lineHeight: lineHeightScale}}>{verse.text}</p>
                                        {hasCollection || hasNote ? <div className="row gap-sm wrap">
                                            {hasCollection ? (
                                                <span className="chip chip-collection">Collection</span>
                                            ) : null}
                                            {hasNote ? <span className="chip">Note</span> : null}
                                        </div> : null}
                                    </article>
                                );
                            })}
                        </div>
                    </article>

                    {compareMode ? (
                        <article className="panel stack-sm reader-pane reader-pane-secondary">
                            <header className="stack-xs">
                                <p className="eyebrow">EN English (KJV)</p>
                                <h3>{(booksMap.get(compareBookId)?.title ?? compareBookId)} {compareChapter}</h3>
                                <p className="muted">Parallel study pane</p>
                            </header>

                            <button
                                className="collapse-toggle"
                                type="button"
                                onClick={() => setShowComparePanel(value => !value)}
                                aria-expanded={showComparePanel}
                            >
                                Jump and compare
                                <span className="material-symbols-outlined">{showComparePanel ? 'expand_less' : 'expand_more'}</span>
                            </button>

                            {showComparePanel ? (
                                <div className="compare-controls">
                                    <label className="stack-xs">
                                        <span className="muted">Compare book</span>
                                        <select
                                            className="input"
                                            value={compareBookId}
                                            onChange={event => {
                                                const nextBookId = event.target.value;
                                                const nextBook = booksMap.get(nextBookId);
                                                setCompareBookId(nextBookId);
                                                setCompareChapter(prev => Math.min(prev, nextBook?.chaptersNum ?? 1));
                                            }}
                                        >
                                            {books.map(book => (
                                                <option key={book.id} value={book.id}>
                                                    {book.title}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="stack-xs">
                                        <span className="muted">Compare chapter</span>
                                        <select
                                            className="input"
                                            value={compareChapter}
                                            onChange={event => setCompareChapter(Number(event.target.value))}
                                        >
                                            {Array.from({length: compareChapterCount}, (_, index) => index + 1).map(value => (
                                                <option key={value} value={value}>
                                                    Chapter {value}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            ) : null}

                            <div className="stack-sm verse-stack">
                                {compareVerseEntries.map(verse => (
                                    <article className="verse-row parallel-verse" key={verse.key}>
                                        <p style={{fontSize: `${Math.max(0.95, fontScale)}rem`, lineHeight: lineHeightScale}}>
                                            {verse.text}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </article>
                    ) : null}
                </div>
            </div>

            <div className="panel stack-sm">
                <div className="section-header">
                    <div>
                        <p className="eyebrow">Cross references</p>
                        <h3>Related verses</h3>
                    </div>
                    <button
                        className="collapse-toggle"
                        type="button"
                        onClick={() => setShowRelated(value => !value)}
                        aria-expanded={showRelated}
                    >
                        {showRelated ? 'Hide' : 'Show'}
                        <span className="material-symbols-outlined">{showRelated ? 'expand_less' : 'expand_more'}</span>
                    </button>
                </div>

                {showRelated
                    ? related.map(item => (
                        <Link
                            className="related-item"
                            key={item.key}
                            to={`/reader/${item.bookId}/${item.chapter}`}
                            state={{targetVerse: item.verse, source: 'related'}}
                        >
                            <strong>
                                {(booksMap.get(item.bookId)?.title ?? item.bookId)} {item.chapter}:{item.verse}
                            </strong>
                            <p>{item.text}</p>
                        </Link>
                    ))
                    : null}
            </div>

            <div className="chapter-floating-nav">
                <button className="chapter-nav-btn" type="button" onClick={() => goToChapter(numericChapter - 1)}>
                    <span className="material-symbols-outlined">chevron_left</span>
                    Previous
                </button>
                <button className="chapter-nav-btn chapter-nav-btn-primary" type="button" onClick={() => goToChapter(numericChapter + 1)}>
                    Next
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>

            {selectedVerse ? (
                <div className="verse-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setSelectedVerseKey(null)}>
                    <div className="verse-modal" onClick={event => event.stopPropagation()}>
                        <div className="section-header">
                            <div>
                                <p className="eyebrow">Verse actions</p>
                                <h3>
                                    {bookTitle} {numericChapter}:{selectedVerse.label}
                                </h3>
                            </div>
                            <button className="icon-button mini" type="button" onClick={() => setSelectedVerseKey(null)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <p className="verse-text">{selectedVerse.text}</p>

                        <div className="row gap-sm wrap">
                            <button
                                className={selectedVerseKey && isBookmarked(selectedVerseKey) ? 'chip chip-bookmark chip-active-bookmark' : 'chip chip-bookmark'}
                                type="button"
                                onClick={() =>
                                    toggleBookmark({
                                        key: selectedVerseKey!,
                                        bookId,
                                        chapter: numericChapter,
                                        verse: selectedVerse.verse.verseid,
                                        text: selectedVerse.text
                                    })
                                }
                            >
                                Bookmark
                            </button>
                            <button
                                className={selectedVerseKey && isHighlighted(selectedVerseKey) ? 'chip chip-highlight chip-active-highlight' : 'chip chip-highlight'}
                                type="button"
                                onClick={() =>
                                    toggleHighlight({
                                        key: selectedVerseKey!,
                                        bookId,
                                        chapter: numericChapter,
                                        verse: selectedVerse.verse.verseid,
                                        text: selectedVerse.text
                                    })
                                }
                            >
                                Highlight
                            </button>
                            <button className="chip" type="button" onClick={() => void shareSelectedVerse()}>
                                Share
                            </button>
                        </div>

                        <div className="stack-xs">
                            <p className="meta">Collections</p>
                            <div className="row gap-sm wrap">
                                {collections.map(collection => (
                                    <button
                                        key={collection.id}
                                        className={selectedVerseKey && isInCollection(collection.id, selectedVerseKey)
                                            ? 'chip chip-collection chip-active-collection'
                                            : 'chip chip-collection'}
                                        type="button"
                                        onClick={() => applyCollection(collection.id)}
                                    >
                                        {collection.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="stack-xs">
                            <p className="meta">Create collection</p>
                            <div className="row gap-sm wrap">
                                <input
                                    className="input"
                                    placeholder="Collection name"
                                    value={newCollectionName}
                                    onChange={event => setNewCollectionName(event.target.value)}
                                />
                                <button className="btn btn-primary" type="button" onClick={createAndAttachCollection}>
                                    Add
                                </button>
                            </div>
                        </div>

                        <div className="stack-xs">
                            <p className="meta">Reflection note</p>
                            <textarea
                                className="input"
                                rows={4}
                                value={noteDraft}
                                onChange={event => setNoteDraft(event.target.value)}
                                placeholder="Write your reflection for this verse"
                            />
                            <div className="row gap-sm wrap">
                                <button className="btn btn-primary" type="button" onClick={saveSelectedVerseNote}>
                                    Save note
                                </button>
                                {selectedVerseNote ? (
                                    <button className="btn" type="button" onClick={clearSelectedVerseNote}>
                                        Remove note
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        {selectedVerseCollections.length > 0 ? (
                            <p className="muted">In: {selectedVerseCollections.map(collection => collection.name).join(', ')}</p>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </section>
    );
}
