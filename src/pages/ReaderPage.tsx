import {useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Link, useLocation, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {
    buildRelatedQuery,
    getRelatedVerses,
    loadBooks,
    loadChapterFile,
    loadReaderIndex,
    mergeRelatedVerses
} from '../data/api';
import {Book, ChapterRow, isSubtitle, isVerse, SearchVerse} from '../types/bible';
import {useSettingsStore} from '../store/settingsStore';
import {HIGHLIGHT_COLORS, useSavedStore, type HighlightColor} from '../store/savedStore';
import {buildSharePayload, readerShareUrl} from '../lib/site';
import {getUi} from '../i18n/ui';
import Icon from '../components/Icon';

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
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const fontScale = useSettingsStore(state => state.fontScale);
    const setFontScale = useSettingsStore(state => state.setFontScale);
    const lineHeightScale = useSettingsStore(state => state.lineHeightScale);
    const setLineHeightScale = useSettingsStore(state => state.setLineHeightScale);
    const setLastReading = useSettingsStore(state => state.setLastReading);
    const ui = getUi(systemLanguage);

    const [books, setBooks] = useState<Book[]>([]);
    const [bookTitle, setBookTitle] = useState('');
    const [chapterCount, setChapterCount] = useState(0);
    const [chapterRows, setChapterRows] = useState<ChapterRow[]>([]);
    const [compareRows, setCompareRows] = useState<ChapterRow[]>([]);
    const [readerIndex, setReaderIndex] = useState<SearchVerse[]>([]);
    const [isLoadingChapter, setIsLoadingChapter] = useState(true);
    const [isLoadingBooks, setIsLoadingBooks] = useState(true);
    const [compareMode, setCompareMode] = useState(false);
    const [showReaderTools, setShowReaderTools] = useState(false);
    const [showRelated, setShowRelated] = useState(false);
    const [showComparePanel, setShowComparePanel] = useState(false);
    const [compareBookId, setCompareBookId] = useState(bookId);
    const [compareChapter, setCompareChapter] = useState(numericChapter);
    const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);
    const [activeParallelVerse, setActiveParallelVerse] = useState<number | null>(null);
    const [noteDraft, setNoteDraft] = useState('');
    const [newCollectionName, setNewCollectionName] = useState('');
    const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
    const [related, setRelated] = useState<SearchVerse[]>([]);
    const [selectMode, setSelectMode] = useState(false);
    const [multiSelected, setMultiSelected] = useState<string[]>([]);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);
    const touchStartX = useRef<number | null>(null);
    const highlightTimeout = useRef<number | null>(null);
    const lastJumpRef = useRef('');
    const modalRef = useRef<HTMLDivElement | null>(null);
    const readerIndexLoaded = useRef(false);
    const relatedWorkerRef = useRef<Worker | null>(null);
    const relatedRequestRef = useRef(0);

    const toggleBookmark = useSavedStore(state => state.toggleBookmark);
    const toggleHighlight = useSavedStore(state => state.toggleHighlight);
    const getHighlightColor = useSavedStore(state => state.getHighlightColor);
    const notes = useSavedStore(state => state.notes);
    const collections = useSavedStore(state => state.collections);
    const collectionItems = useSavedStore(state => state.collectionItems);
    const createCollection = useSavedStore(state => state.createCollection);
    const addToCollection = useSavedStore(state => state.addToCollection);
    const removeFromCollection = useSavedStore(state => state.removeFromCollection);
    const upsertNote = useSavedStore(state => state.upsertNote);
    const removeNote = useSavedStore(state => state.removeNote);
    const isInCollection = useSavedStore(state => state.isInCollection);
    const isBookmarked = useSavedStore(state => state.isBookmarked);
    const isHighlighted = useSavedStore(state => state.isHighlighted);
    const versesState = useSavedStore(state => state.verses);

    useEffect(() => {
        setIsLoadingBooks(true);
        void loadBooks(language).then(bookList => {
            setBooks(bookList);
            const book = bookList.find(item => item.id === bookId);
            if (book) {
                setBookTitle(book.title);
                setChapterCount(book.chaptersNum);
            } else {
                setBookTitle(bookId);
                setChapterCount(1);
            }
            setIsLoadingBooks(false);
        });
    }, [language, bookId]);

    useEffect(() => {
        setIsLoadingChapter(true);
        void loadChapterFile(language, bookId, numericChapter).then(chapterFile => {
            setChapterRows(Array.isArray(chapterFile?.chapters) ? chapterFile!.chapters : []);
            setIsLoadingChapter(false);
        });
    }, [language, bookId, numericChapter]);

    useEffect(() => {
        if (readerIndexLoaded.current && readerIndex.length > 0) {
            return;
        }

        void loadReaderIndex(language).then(index => {
            setReaderIndex(index);
            readerIndexLoaded.current = true;
        });
    }, [language, readerIndex.length]);

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
        return () => {
            if (highlightTimeout.current) {
                window.clearTimeout(highlightTimeout.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!selectedVerseKey) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSelectedVerseKey(null);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        const previouslyFocused = document.activeElement as HTMLElement | null;
        modalRef.current?.querySelector<HTMLElement>('button, [href], input, textarea, select')?.focus();

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            previouslyFocused?.focus?.();
        };
    }, [selectedVerseKey]);

    const verses = useMemo(() => chapterRows.filter(isVerse), [chapterRows]);
    const compareVerses = useMemo(() => compareRows.filter(isVerse), [compareRows]);
    const booksMap = useMemo(() => new Map(books.map(book => [book.id, book])), [books]);
    const bookmarkedKeys = useMemo(
        () => new Set(versesState.filter(item => item.kind === 'bookmark').map(item => item.key)),
        [versesState]
    );
    const highlightedKeys = useMemo(
        () => new Set(versesState.filter(item => item.kind === 'highlight').map(item => item.key)),
        [versesState]
    );
    const highlightColorMap = useMemo(() => {
        const map = new Map<string, HighlightColor>();
        for (const item of versesState) {
            if (item.kind === 'highlight') {
                map.set(item.key, item.color ?? 'gold');
            }
        }
        return map;
    }, [versesState]);
    const collectionKeys = useMemo(() => new Set(collectionItems.map(item => item.key)), [collectionItems]);
    const noteKeySet = useMemo(() => new Set(notes.map(note => note.key)), [notes]);

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
                    verseId: verse.verseid,
                    ...parsed
                };
            }),
        [compareVerses]
    );
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

    useEffect(() => {
        relatedWorkerRef.current = new Worker(new URL('../workers/searchWorker.ts', import.meta.url), {
            type: 'module'
        });
        return () => {
            relatedWorkerRef.current?.terminate();
            relatedWorkerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (verseEntries.length === 0) {
            setRelated([]);
            return;
        }

        const selected = selectedVerseKey
            ? verseEntries.find(entry => entry.key === selectedVerseKey)
            : null;
        const anchor = selected ?? verseEntries[Math.min(2, verseEntries.length - 1)];
        const source = {
            bookId,
            chapter: numericChapter,
            verse: anchor.verse.verseid,
            text: anchor.text
        };
        const sourceKey = `${bookId}:${numericChapter}:${anchor.verse.verseid}`;
        const indexRelated = readerIndex.length > 0 ? getRelatedVerses(source, readerIndex, 8) : [];
        setRelated(indexRelated);

        if (!showRelated || !relatedWorkerRef.current || books.length === 0) {
            return;
        }

        const query = buildRelatedQuery(anchor.text);
        if (!query) {
            return;
        }

        relatedRequestRef.current += 1;
        const requestId = relatedRequestRef.current;
        const worker = relatedWorkerRef.current;

        worker.onmessage = event => {
            const payload = event.data as {type: 'results'; requestId: number; results: SearchVerse[]};
            if (payload.type !== 'results' || payload.requestId !== requestId) {
                return;
            }
            setRelated(mergeRelatedVerses(indexRelated, payload.results, sourceKey, 8));
        };

        worker.postMessage({
            type: 'search',
            requestId,
            language,
            query,
            books: books.map(book => book.id),
            limit: 40
        });
    }, [verseEntries, readerIndex, bookId, numericChapter, showRelated, books, language, selectedVerseKey]);

    useEffect(() => {
        setMultiSelected([]);
        setSelectMode(false);
        setCopyStatus(null);
    }, [bookId, numericChapter]);

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
        setActiveParallelVerse(targetVerse);

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

    const selectVerse = (key: string, verseId: number) => {
        if (selectMode) {
            setMultiSelected(current =>
                current.includes(key) ? current.filter(item => item !== key) : [...current, key]
            );
            setActiveParallelVerse(verseId);
            return;
        }
        setSelectedVerseKey(key);
        setActiveParallelVerse(verseId);
    };

    const colorLabel = (color: HighlightColor) => {
        if (color === 'rose') return ui.colorRose;
        if (color === 'green') return ui.colorGreen;
        if (color === 'sky') return ui.colorSky;
        return ui.colorGold;
    };

    const formatCitation = (entries: typeof verseEntries) => {
        if (entries.length === 0) {
            return '';
        }
        const sorted = [...entries].sort((left, right) => left.verse.verseid - right.verse.verseid);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const verseLabel =
            first.verse.verseid === last.verse.verseid
                ? first.label
                : `${first.start}-${last.end}`;
        const reference = `${bookTitle} ${numericChapter}:${verseLabel}`;
        const body = sorted.map(entry => `${entry.label} ${entry.text}`).join('\n');
        const url = readerShareUrl(bookId, numericChapter, first.verse.verseid);
        return `${body}\n\n${reference}\n${url}`;
    };

    const copyCitationText = async (text: string) => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                setCopyStatus(ui.copied);
                window.setTimeout(() => setCopyStatus(null), 1800);
            }
        } catch {
            setCopyStatus(null);
        }
    };

    const copySelectedCitation = async () => {
        if (selectedVerse) {
            await copyCitationText(formatCitation([selectedVerse]));
            return;
        }
        const entries = verseEntries.filter(entry => multiSelected.includes(entry.key));
        await copyCitationText(formatCitation(entries));
    };

    const shareMultiSelected = async () => {
        const entries = verseEntries.filter(entry => multiSelected.includes(entry.key));
        if (entries.length === 0) {
            return;
        }
        const text = formatCitation(entries);
        const sorted = [...entries].sort((left, right) => left.verse.verseid - right.verse.verseid);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const verseLabel =
            first.verse.verseid === last.verse.verseid ? first.label : `${first.start}-${last.end}`;
        const reference = `${bookTitle} ${numericChapter}:${verseLabel}`;
        const url = readerShareUrl(bookId, numericChapter, first.verse.verseid);
        const payload = buildSharePayload(reference, text, url);
        try {
            if (navigator.share) {
                await navigator.share(payload);
                return;
            }
            await copyCitationText(text);
        } catch {
            // ignore
        }
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

    const verseRowClass = (key: string, start: number, end: number) => {
        const classes = ['verse-row'];
        if (highlightedVerse != null && highlightedVerse >= start && highlightedVerse <= end) {
            classes.push('verse-row-highlighted');
        }
        if (activeParallelVerse != null && activeParallelVerse >= start && activeParallelVerse <= end) {
            classes.push('verse-row-active');
        }
        if (bookmarkedKeys.has(key)) {
            classes.push('verse-row-bookmarked');
        }
        if (highlightedKeys.has(key)) {
            classes.push('verse-row-saved-highlight');
            classes.push(`verse-row-hl-${highlightColorMap.get(key) ?? 'gold'}`);
        }
        if (collectionKeys.has(key)) {
            classes.push('verse-row-collected');
        }
        if (noteKeySet.has(key)) {
            classes.push('verse-row-noted');
        }
        if (multiSelected.includes(key)) {
            classes.push('verse-row-multi-selected');
        }
        return classes.join(' ');
    };

    return (
        <section className="stack-lg">
            <div className="reader-shell stack-lg">
                <header className="panel hero-panel reader-hero stack-sm">
                    <div className="section-header">
                        <div>
                            <p className="eyebrow">{ui.immersiveReader}</p>
                            <h2>
                                {isLoadingBooks || !bookTitle ? '…' : `${bookTitle} ${numericChapter}`}
                            </h2>
                            <p className="muted">
                                {chapterCount > 0 ? ui.chapterOf(numericChapter, chapterCount) : '…'}
                            </p>
                        </div>
                        <button
                            className={compareMode ? 'btn btn-primary' : 'btn'}
                            type="button"
                            onClick={() => setCompareMode(value => !value)}
                            aria-pressed={compareMode}
                        >
                            {compareMode ? ui.dualPaneOn : ui.dualPaneOff}
                        </button>
                    </div>

                    <button
                        className="collapse-toggle"
                        type="button"
                        onClick={() => setShowReaderTools(value => !value)}
                        aria-expanded={showReaderTools}
                    >
                        {ui.displaySettings}
                        <Icon name={showReaderTools ? 'expand_less' : 'expand_more'} size={18} />
                    </button>

                    {showReaderTools ? (
                        <div className="reader-settings-grid">
                            <label className="stack-xs reader-slider">
                                <span>{ui.textSize}</span>
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
                                <span>{ui.spacing}</span>
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
                            {ui.chapters}
                        </Link>
                        <button
                            className={selectMode ? 'btn btn-primary' : 'btn'}
                            type="button"
                            onClick={() => {
                                setSelectMode(value => !value);
                                setMultiSelected([]);
                                setSelectedVerseKey(null);
                            }}
                            aria-pressed={selectMode}
                        >
                            {selectMode ? ui.doneSelecting : ui.selectVerses}
                        </button>
                        {selectMode && multiSelected.length > 0 ? (
                            <>
                                <span className="meta">{ui.selectedCount(multiSelected.length)}</span>
                                <button className="btn" type="button" onClick={() => void copySelectedCitation()}>
                                    {copyStatus ?? ui.copyCitation}
                                </button>
                                <button className="btn btn-primary" type="button" onClick={() => void shareMultiSelected()}>
                                    {ui.shareSelected}
                                </button>
                            </>
                        ) : null}
                    </div>
                </header>

                <div
                    className={compareMode ? 'reader-grid reader-grid-compare paper-swipe reader-compare-wrap' : 'reader-grid paper-swipe'}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                >
                    <article className="panel stack-sm reader-pane verse-pane-main">
                        <header className="stack-xs">
                            <p className="eyebrow eyebrow-primary">{ui.primaryPane}</p>
                            <h3>
                                {bookTitle} {numericChapter}
                            </h3>
                        </header>

                        <div className="stack-sm verse-stack">
                            {isLoadingChapter &&
                                Array.from({length: 8}).map((_, index) => (
                                    <div className="verse-row skeleton" key={`verse-skeleton-${index}`}/>
                                ))}
                            {!isLoadingChapter
                                ? chapterRows.map((row, index) => {
                                      if (isSubtitle(row)) {
                                          return (
                                              <h4 className="chapter-subtitle" key={`subtitle-${bookId}-${numericChapter}-${index}`}>
                                                  {row.subtitle}
                                              </h4>
                                          );
                                      }
                                      if (!isVerse(row)) {
                                          return null;
                                      }
                                      const verse = verseEntries.find(entry => entry.verse.verseid === row.verseid);
                                      if (!verse) {
                                          return null;
                                      }
                                      const hasCollection = collectionKeys.has(verse.key);
                                      const hasNote = noteKeySet.has(verse.key);
                                      const hasBookmark = bookmarkedKeys.has(verse.key);
                                      const hasHighlight = highlightedKeys.has(verse.key);
                                      return (
                                          <article
                                              className={verseRowClass(verse.key, verse.start, verse.end)}
                                              key={verse.key}
                                              data-verse-key={verse.key}
                                              onClick={() => selectVerse(verse.key, verse.verse.verseid)}
                                          >
                                              {selectMode ? (
                                                  <span
                                                      className={
                                                          multiSelected.includes(verse.key)
                                                              ? 'verse-check verse-check-on'
                                                              : 'verse-check'
                                                      }
                                                      aria-hidden="true"
                                                  />
                                              ) : (
                                                  <span className="verse-number">{verse.label}</span>
                                              )}
                                              <p
                                                  className="verse-body"
                                                  style={{fontSize: `${fontScale}rem`, lineHeight: lineHeightScale}}
                                              >
                                                  {selectMode ? (
                                                      <span className="verse-inline-number">{verse.label} </span>
                                                  ) : null}
                                                  {verse.text}
                                              </p>
                                              {hasBookmark || hasHighlight || hasCollection || hasNote ? (
                                                  <div className="verse-marker-dots" aria-hidden="true">
                                                      {hasBookmark ? <span className="dot dot-bookmark"/> : null}
                                                      {hasHighlight ? (
                                                          <span
                                                              className={`dot dot-highlight dot-hl-${highlightColorMap.get(verse.key) ?? 'gold'}`}
                                                          />
                                                      ) : null}
                                                      {hasCollection ? <span className="dot dot-collection"/> : null}
                                                      {hasNote ? <span className="dot dot-note"/> : null}
                                                  </div>
                                              ) : null}
                                          </article>
                                      );
                                  })
                                : null}
                        </div>
                    </article>

                    {compareMode ? (
                        <article className="panel stack-sm reader-pane reader-pane-secondary">
                            <header className="stack-xs">
                                <p className="eyebrow eyebrow-secondary">{ui.parallelPane}</p>
                                <h3>
                                    {(booksMap.get(compareBookId)?.title ?? compareBookId)} {compareChapter}
                                </h3>
                                <p className="muted">{ui.parallelStudyHint}</p>
                            </header>

                            <button
                                className="collapse-toggle"
                                type="button"
                                onClick={() => setShowComparePanel(value => !value)}
                                aria-expanded={showComparePanel}
                            >
                                {ui.jumpAndCompare}
                                <Icon name={showComparePanel ? 'expand_less' : 'expand_more'} size={18} />
                            </button>

                            {showComparePanel ? (
                                <div className="compare-controls">
                                    <label className="stack-xs">
                                        <span className="muted">{ui.compareBook}</span>
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
                                        <span className="muted">{ui.compareChapter}</span>
                                        <select
                                            className="input"
                                            value={compareChapter}
                                            onChange={event => setCompareChapter(Number(event.target.value))}
                                        >
                                            {Array.from({length: compareChapterCount}, (_, index) => index + 1).map(value => (
                                                <option key={value} value={value}>
                                                    {value}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            ) : null}

                            <div className="stack-sm verse-stack">
                                {compareRows.map((row, index) => {
                                    if (isSubtitle(row)) {
                                        return (
                                            <h4
                                                className="chapter-subtitle"
                                                key={`compare-sub-${compareBookId}-${compareChapter}-${index}`}
                                            >
                                                {row.subtitle}
                                            </h4>
                                        );
                                    }
                                    if (!isVerse(row)) {
                                        return null;
                                    }
                                    const verse = compareVerseEntries.find(entry => entry.verseId === row.verseid);
                                    if (!verse) {
                                        return null;
                                    }
                                    return (
                                        <article
                                            className={
                                                activeParallelVerse != null &&
                                                activeParallelVerse >= verse.start &&
                                                activeParallelVerse <= verse.end
                                                    ? 'verse-row parallel-verse verse-row-active'
                                                    : 'verse-row parallel-verse'
                                            }
                                            key={verse.key}
                                            onClick={() => setActiveParallelVerse(verse.verseId)}
                                        >
                                            <span className="verse-number verse-number-secondary">{verse.label}</span>
                                            <p
                                                className="verse-body"
                                                style={{
                                                    fontSize: `${Math.max(0.95, fontScale)}rem`,
                                                    lineHeight: lineHeightScale
                                                }}
                                            >
                                                {verse.text}
                                            </p>
                                        </article>
                                    );
                                })}
                            </div>
                        </article>
                    ) : null}
                </div>
            </div>

            <div className="panel stack-sm">
                <div className="section-header">
                    <div>
                        <p className="eyebrow">{ui.crossReferences}</p>
                        <h3>{ui.relatedVerses}</h3>
                    </div>
                    <button
                        className="collapse-toggle"
                        type="button"
                        onClick={() => setShowRelated(value => !value)}
                        aria-expanded={showRelated}
                    >
                        {showRelated ? ui.hide : ui.show}
                        <Icon name={showRelated ? 'expand_less' : 'expand_more'} size={18} />
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
                    <Icon name="chevron_left" size={18} />
                    {ui.previous}
                </button>
                <button className="chapter-nav-btn chapter-nav-btn-primary" type="button" onClick={() => goToChapter(numericChapter + 1)}>
                    {ui.next}
                    <Icon name="chevron_right" size={18} />
                </button>
            </div>

            {selectedVerse ? createPortal(
                <div
                    className="verse-modal-backdrop"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="verse-modal-title"
                    onClick={() => setSelectedVerseKey(null)}
                >
                    <div className="verse-modal" ref={modalRef} onClick={event => event.stopPropagation()}>
                        <div className="section-header">
                            <div>
                                <p className="eyebrow">{ui.verseActions}</p>
                                <h3 id="verse-modal-title">
                                    {bookTitle} {numericChapter}:{selectedVerse.label}
                                </h3>
                            </div>
                            <button className="icon-button mini" type="button" onClick={() => setSelectedVerseKey(null)}>
                                <Icon name="close" size={18} />
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
                                {ui.bookmark}
                            </button>
                            <button className="chip" type="button" onClick={() => void shareSelectedVerse()}>
                                {ui.share}
                            </button>
                            <button className="chip" type="button" onClick={() => void copySelectedCitation()}>
                                {copyStatus ?? ui.copyCitation}
                            </button>
                        </div>

                        <div className="stack-xs">
                            <p className="meta">{ui.highlightColor}</p>
                            <div className="row gap-sm wrap highlight-color-row">
                                {HIGHLIGHT_COLORS.map(color => {
                                    const active =
                                        selectedVerseKey != null && getHighlightColor(selectedVerseKey) === color;
                                    return (
                                        <button
                                            key={color}
                                            type="button"
                                            className={
                                                active
                                                    ? `chip chip-hl chip-hl-${color} chip-hl-active`
                                                    : `chip chip-hl chip-hl-${color}`
                                            }
                                            onClick={() =>
                                                toggleHighlight(
                                                    {
                                                        key: selectedVerseKey!,
                                                        bookId,
                                                        chapter: numericChapter,
                                                        verse: selectedVerse.verse.verseid,
                                                        text: selectedVerse.text
                                                    },
                                                    color
                                                )
                                            }
                                        >
                                            {colorLabel(color)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="stack-xs">
                            <p className="meta">{ui.collections}</p>
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
                            <p className="meta">{ui.createCollection}</p>
                            <div className="row gap-sm wrap">
                                <input
                                    className="input"
                                    placeholder={ui.createCollection}
                                    value={newCollectionName}
                                    onChange={event => setNewCollectionName(event.target.value)}
                                />
                                <button className="btn btn-primary" type="button" onClick={createAndAttachCollection}>
                                    {ui.add}
                                </button>
                            </div>
                        </div>

                        <div className="stack-xs">
                            <p className="meta">{ui.reflectionNote}</p>
                            <textarea
                                className="input"
                                rows={4}
                                value={noteDraft}
                                onChange={event => setNoteDraft(event.target.value)}
                                placeholder={ui.reflectionNote}
                            />
                            <div className="row gap-sm wrap">
                                <button className="btn btn-primary" type="button" onClick={saveSelectedVerseNote}>
                                    {ui.saveNote}
                                </button>
                                {selectedVerseNote ? (
                                    <button className="btn" type="button" onClick={clearSelectedVerseNote}>
                                        {ui.removeNote}
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        {selectedVerseCollections.length > 0 ? (
                            <p className="muted">
                                {ui.inCollections(selectedVerseCollections.map(collection => collection.name).join(', '))}
                            </p>
                        ) : null}
                    </div>
                </div>,
                document.body
            ) : null}
        </section>
    );
}
