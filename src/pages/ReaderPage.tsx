import {Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {Link, useLocation, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {loadBooks, loadChapterFile} from '../data/api';
import {isSubreference, isSubtitle, isVerse, type Book, type ChapterRow} from '../types/bible';
import {normalizeChapterVerses} from '../lib/verseNormalize.js';
import {useSettingsStore} from '../store/settingsStore';
import {HIGHLIGHT_COLORS, useSavedStore, type HighlightColor} from '../store/savedStore';
import {chapterKey, useProgressStore} from '../store/progressStore';
import {toast, useUiStore} from '../store/uiStore';
import {copyText, formatCitation, readerShareUrl, sharePassage} from '../lib/site';
import {getUi} from '../i18n/ui';
import Icon from '../components/Icon';
import JumpSheet from '../components/reader/JumpSheet';
import ReadingOptionsSheet from '../components/reader/ReadingOptionsSheet';
import VerseSheet, {type ReaderVerse} from '../components/reader/VerseSheet';
import {colorLabel} from '../i18n/ui';
import ThemeSheet from '../components/ThemeSheet';

type ReaderLocationState = {
    targetKey?: string;
    targetVerse?: number;
} | null;

type LoadState = 'loading' | 'ready' | 'error';

const AUTO_READ_MS = 12_000;
const LONG_PRESS_MS = 480;

const toEntries = (bookId: string, chapter: number, rows: ChapterRow[]): ReaderVerse[] =>
    normalizeChapterVerses(rows).map(verse => ({...verse, key: `${bookId}:${chapter}:${verse.row}`}));

const rangeLabel = (entries: ReaderVerse[]) => {
    const sorted = [...entries].sort((left, right) => left.start - right.start);
    const parts: string[] = [];
    let runStart = sorted[0]?.start ?? 0;
    let runEnd = sorted[0]?.end ?? 0;
    for (const entry of sorted.slice(1)) {
        if (entry.start <= runEnd + 1) {
            runEnd = Math.max(runEnd, entry.end);
            continue;
        }
        parts.push(runStart === runEnd ? String(runStart) : `${runStart}-${runEnd}`);
        runStart = entry.start;
        runEnd = entry.end;
    }
    if (sorted.length > 0) parts.push(runStart === runEnd ? String(runStart) : `${runStart}-${runEnd}`);
    return parts.join(', ');
};

const neighbour = (books: Book[], bookId: string, chapter: number, direction: 1 | -1) => {
    const index = books.findIndex(book => book.id === bookId);
    if (index === -1) return null;
    const book = books[index];
    if (direction === 1) {
        if (chapter < book.chaptersNum) return {book, chapter: chapter + 1};
        const next = books[index + 1];
        return next ? {book: next, chapter: 1} : null;
    }
    if (chapter > 1) return {book, chapter: chapter - 1};
    const previous = books[index - 1];
    return previous ? {book: previous, chapter: previous.chaptersNum} : null;
};

export default function ReaderPage() {
    const {bookId = '', chapter = '1'} = useParams();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const numericChapter = Math.max(1, Number(chapter) || 1);

    const language = useSettingsStore(state => state.language);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const fontScale = useSettingsStore(state => state.fontScale);
    const lineHeightScale = useSettingsStore(state => state.lineHeightScale);
    const readerLayout = useSettingsStore(state => state.readerLayout);
    const readerFont = useSettingsStore(state => state.readerFont);
    const showVerseNumbers = useSettingsStore(state => state.showVerseNumbers);
    const showHeadings = useSettingsStore(state => state.showHeadings);
    const showMarkers = useSettingsStore(state => state.showMarkers);
    const focusAutoHide = useSettingsStore(state => state.focusAutoHide);
    const setLastReading = useSettingsStore(state => state.setLastReading);
    const ui = getUi(systemLanguage);

    const savedVerses = useSavedStore(state => state.verses);
    const notes = useSavedStore(state => state.notes);
    const collectionItems = useSavedStore(state => state.collectionItems);
    const setBookmarked = useSavedStore(state => state.setBookmarked);
    const toggleHighlight = useSavedStore(state => state.toggleHighlight);
    const removeHighlight = useSavedStore(state => state.removeHighlight);

    const readChapters = useProgressStore(state => state.readChapters);
    const markChapterRead = useProgressStore(state => state.markChapterRead);
    const unmarkChapter = useProgressStore(state => state.unmarkChapter);

    const chromeHidden = useUiStore(state => state.chromeHidden);
    const setChromeHidden = useUiStore(state => state.setChromeHidden);
    const autoHidePausedUntil = useRef(0);

    const [books, setBooks] = useState<Book[]>([]);
    const [rows, setRows] = useState<ChapterRow[]>([]);
    const [loadState, setLoadState] = useState<LoadState>('loading');
    const [reloadToken, setReloadToken] = useState(0);
    const [jumpOpen, setJumpOpen] = useState(false);
    const [optionsOpen, setOptionsOpen] = useState(false);
    const [themeOpen, setThemeOpen] = useState(false);
    const [sheetVerse, setSheetVerse] = useState<ReaderVerse | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectMode, setSelectMode] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [bulkColorsOpen, setBulkColorsOpen] = useState(false);
    const [flashKey, setFlashKey] = useState<string | null>(null);
    const [activeVerse, setActiveVerse] = useState<number | null>(null);
    const [compareMode, setCompareMode] = useState(false);
    const [compareBookId, setCompareBookId] = useState(bookId);
    const [compareChapter, setCompareChapter] = useState(numericChapter);
    const [compareRows, setCompareRows] = useState<ChapterRow[]>([]);

    const endRef = useRef<HTMLDivElement>(null);
    const loadedAt = useRef(Date.now());
    const lastJump = useRef('');
    const touch = useRef<{x: number; y: number; t: number} | null>(null);
    const pressTimer = useRef<number | null>(null);
    const suppressClick = useRef(false);

    useEffect(() => {
        void loadBooks(language).then(setBooks);
    }, [language]);

    useEffect(() => {
        let cancelled = false;
        setLoadState('loading');
        void loadChapterFile(language, bookId, numericChapter).then(file => {
            if (cancelled) return;
            const next = Array.isArray(file?.chapters) ? file.chapters : [];
            setRows(next);
            setLoadState(file && next.length > 0 ? 'ready' : 'error');
            loadedAt.current = Date.now();
        });
        return () => {
            cancelled = true;
        };
    }, [language, bookId, numericChapter, reloadToken]);

    useEffect(() => {
        setSelectMode(false);
        setSelected([]);
        setSheetOpen(false);
        setActiveVerse(null);
        setCompareBookId(bookId);
        setCompareChapter(numericChapter);
        setChromeHidden(false);
    }, [bookId, numericChapter, setChromeHidden]);

    useEffect(() => {
        if (bookId && loadState === 'ready') {
            setLastReading({bookId, chapter: numericChapter});
        }
    }, [bookId, numericChapter, loadState, setLastReading]);

    useEffect(() => {
        if (!compareMode) return;
        let cancelled = false;
        void loadChapterFile(language, compareBookId, compareChapter).then(file => {
            if (!cancelled) setCompareRows(Array.isArray(file?.chapters) ? file.chapters : []);
        });
        return () => {
            cancelled = true;
        };
    }, [language, compareMode, compareBookId, compareChapter]);

    const book = books.find(item => item.id === bookId) ?? null;
    const bookTitle = book?.title ?? '';
    const entries = useMemo(() => toEntries(bookId, numericChapter, rows), [bookId, numericChapter, rows]);
    const entryByRow = useMemo(() => new Map(entries.map(entry => [entry.row, entry])), [entries]);
    const compareEntries = useMemo(() => toEntries(compareBookId, compareChapter, compareRows), [compareBookId, compareChapter, compareRows]);
    const compareEntryByRow = useMemo(() => new Map(compareEntries.map(entry => [entry.row, entry])), [compareEntries]);
    const compareBook = books.find(item => item.id === compareBookId) ?? null;
    const nextTarget = useMemo(() => neighbour(books, bookId, numericChapter, 1), [books, bookId, numericChapter]);
    const prevTarget = useMemo(() => neighbour(books, bookId, numericChapter, -1), [books, bookId, numericChapter]);
    const isRead = Boolean(readChapters[chapterKey(bookId, numericChapter)]);

    const markers = useMemo(() => {
        const bookmarks = new Set<string>();
        const highlights = new Map<string, HighlightColor>();
        for (const item of savedVerses) {
            if (item.kind === 'bookmark') bookmarks.add(item.key);
            else highlights.set(item.key, item.color ?? 'gold');
        }
        return {
            bookmarks,
            highlights,
            notes: new Set(notes.map(note => note.key)),
            collections: new Set(collectionItems.map(item => item.key))
        };
    }, [savedVerses, notes, collectionItems]);

    const anySheetOpen = jumpOpen || optionsOpen || themeOpen || sheetOpen;

    const goTo = useCallback(
        (target: {book: Book; chapter: number} | null) => {
            if (target) navigate(`/reader/${target.book.id}/${target.chapter}`);
        },
        [navigate]
    );

    // Deep links: exact row from in-app links, or the printed verse number from shared URLs.
    useEffect(() => {
        if (loadState !== 'ready' || entries.length === 0) return;
        const state = location.state as ReaderLocationState;
        const queryVerse = Number(searchParams.get('verse'));
        const targetVerse = state?.targetVerse ?? (Number.isFinite(queryVerse) && queryVerse > 0 ? queryVerse : undefined);
        const target = state?.targetKey
            ? entries.find(entry => entry.key === state.targetKey)
            : targetVerse
              ? entries.find(entry => targetVerse >= entry.start && targetVerse <= entry.end)
              : undefined;
        if (!target) return;

        const jumpId = `${location.key}:${target.key}`;
        if (lastJump.current === jumpId) return;
        lastJump.current = jumpId;

        const frame = requestAnimationFrame(() => {
            autoHidePausedUntil.current = performance.now() + 1500;
            document.querySelector(`[data-verse-key='${target.key}']`)?.scrollIntoView({behavior: 'smooth', block: 'center'});
            setFlashKey(target.key);
            setActiveVerse(target.start);
        });
        const timer = window.setTimeout(() => setFlashKey(null), 2600);
        return () => {
            cancelAnimationFrame(frame);
            window.clearTimeout(timer);
        };
    }, [loadState, entries, location.state, location.key, searchParams]);

    // Focus mode: hide chrome on scroll down, reveal on scroll up or at the end of the chapter.
    useEffect(() => {
        if (!focusAutoHide) {
            setChromeHidden(false);
            return;
        }
        let lastY = window.scrollY;
        let frame = 0;
        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const y = window.scrollY;
                const delta = y - lastY;
                if (performance.now() < autoHidePausedUntil.current) {
                    lastY = y;
                    return;
                }
                const nearBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 80;
                if (y < 60 || nearBottom) {
                    setChromeHidden(false);
                } else if (delta > 8) {
                    setChromeHidden(true);
                } else if (delta < -12) {
                    setChromeHidden(false);
                }
                lastY = y;
            });
        };
        window.addEventListener('scroll', onScroll, {passive: true});
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
        };
    }, [focusAutoHide, setChromeHidden]);

    useEffect(() => () => setChromeHidden(false), [setChromeHidden]);

    useEffect(() => {
        if (selectMode || anySheetOpen) setChromeHidden(false);
    }, [selectMode, anySheetOpen, setChromeHidden]);

    // Count a chapter as read once its end has been reached after a real reading pause.
    useEffect(() => {
        const sentinel = endRef.current;
        if (!sentinel || loadState !== 'ready' || isRead) return;
        let timer: number | null = null;
        const observer = new IntersectionObserver(([entry]) => {
            if (timer) window.clearTimeout(timer);
            if (!entry?.isIntersecting) return;
            const wait = Math.max(0, AUTO_READ_MS - (Date.now() - loadedAt.current));
            timer = window.setTimeout(() => {
                markChapterRead(bookId, numericChapter);
                toast(ui.chapterMarkedRead);
            }, wait);
        });
        observer.observe(sentinel);
        return () => {
            observer.disconnect();
            if (timer) window.clearTimeout(timer);
        };
    }, [loadState, isRead, bookId, numericChapter, markChapterRead, ui.chapterMarkedRead]);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (anySheetOpen || event.metaKey || event.ctrlKey || event.altKey) return;
            const target = event.target as HTMLElement | null;
            if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
            if (event.key === 'ArrowRight') goTo(nextTarget);
            if (event.key === 'ArrowLeft') goTo(prevTarget);
            if (event.key === 'Escape' && selectMode) {
                setSelectMode(false);
                setSelected([]);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [anySheetOpen, goTo, nextTarget, prevTarget, selectMode]);

    const onTouchStart = (event: React.TouchEvent) => {
        const point = event.touches[0];
        touch.current = point && event.touches.length === 1 ? {x: point.clientX, y: point.clientY, t: Date.now()} : null;
    };

    const onTouchEnd = (event: React.TouchEvent) => {
        const start = touch.current;
        touch.current = null;
        const point = event.changedTouches[0];
        if (!start || !point || selectMode) return;
        const dx = point.clientX - start.x;
        const dy = point.clientY - start.y;
        const selection = window.getSelection()?.toString();
        if (selection || Date.now() - start.t > 700 || Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 2.5) return;
        goTo(dx < 0 ? nextTarget : prevTarget);
    };

    const cancelPress = () => {
        if (pressTimer.current) {
            window.clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    const startPress = (key: string) => {
        cancelPress();
        pressTimer.current = window.setTimeout(() => {
            suppressClick.current = true;
            navigator.vibrate?.(10);
            setSelectMode(true);
            setSelected(current => (current.includes(key) ? current : [...current, key]));
        }, LONG_PRESS_MS);
    };

    const onVerseClick = (entry: ReaderVerse) => {
        if (suppressClick.current) {
            suppressClick.current = false;
            return;
        }
        if (window.getSelection()?.toString()) return;
        setActiveVerse(entry.start);
        if (selectMode) {
            setSelected(current => (current.includes(entry.key) ? current.filter(item => item !== entry.key) : [...current, entry.key]));
            return;
        }
        setSheetVerse(entry);
        setSheetOpen(true);
    };

    const verseHandlers = (entry: ReaderVerse) => ({
        'data-verse-key': entry.key,
        onClick: () => onVerseClick(entry),
        onPointerDown: (event: React.PointerEvent) => {
            if (event.pointerType !== 'mouse') startPress(entry.key);
        },
        onPointerUp: cancelPress,
        onPointerLeave: cancelPress,
        onPointerCancel: cancelPress,
        onContextMenu: (event: React.MouseEvent) => {
            if (pressTimer.current || selectMode) event.preventDefault();
        }
    });

    const verseClass = (entry: ReaderVerse, base: string) => {
        const classes = [base];
        if (showMarkers) {
            const color = markers.highlights.get(entry.key);
            if (color) classes.push(`hl hl-${color}`);
            if (markers.bookmarks.has(entry.key)) classes.push('is-bookmarked');
        }
        if (flashKey === entry.key) classes.push('is-flash');
        if (selected.includes(entry.key)) classes.push('is-selected');
        if (compareMode && activeVerse != null && activeVerse >= entry.start && activeVerse <= entry.end) classes.push('is-active');
        return classes.join(' ');
    };

    const markerIcons = (entry: ReaderVerse) =>
        showMarkers && (markers.notes.has(entry.key) || markers.collections.has(entry.key) || markers.bookmarks.has(entry.key)) ? (
            <span className="verse-marks" aria-hidden="true">
                {markers.bookmarks.has(entry.key) ? <Icon name="bookmark" size={12} fill="currentColor" /> : null}
                {markers.notes.has(entry.key) ? <Icon name="edit_note" size={12} /> : null}
                {markers.collections.has(entry.key) ? <Icon name="folder_plus" size={12} /> : null}
            </span>
        ) : null;

    const renderVerses = (source: ChapterRow[], byRow: Map<number, ReaderVerse>, interactive: boolean, keyPrefix: string) => {
        const blocks: ReactNode[] = [];
        let paragraph: ReactNode[] = [];
        const flush = () => {
            if (paragraph.length > 0) {
                blocks.push(
                    <p className="verse-paragraph" key={`${keyPrefix}-p-${blocks.length}`}>
                        {paragraph}
                    </p>
                );
                paragraph = [];
            }
        };

        source.forEach((row, index) => {
            if (isSubtitle(row)) {
                flush();
                if (showHeadings) {
                    blocks.push(
                        <h3 className="passage-heading" key={`${keyPrefix}-h-${index}`}>
                            {row.subtitle}
                        </h3>
                    );
                }
                return;
            }
            if (isSubreference(row)) {
                flush();
                if (showHeadings) {
                    blocks.push(
                        <p className="passage-reference" key={`${keyPrefix}-r-${index}`}>
                            {row.subreference}
                        </p>
                    );
                }
                return;
            }
            if (!isVerse(row)) return;
            const entry = byRow.get(row.verseid);
            if (!entry) return;
            const handlers = interactive ? verseHandlers(entry) : {'data-verse-key': entry.key, onClick: () => setActiveVerse(entry.start)};

            if (readerLayout === 'paragraph') {
                paragraph.push(
                    <Fragment key={entry.key}>
                        <span className={verseClass(entry, 'verse-inline')} {...handlers}>
                            {showVerseNumbers ? <sup className="verse-sup">{entry.label}</sup> : null}
                            {entry.text}
                        </span>{' '}
                    </Fragment>
                );
                return;
            }

            blocks.push(
                <div className={verseClass(entry, 'verse')} key={entry.key} {...handlers}>
                    {selectMode && interactive ? (
                        <span className={selected.includes(entry.key) ? 'verse-check verse-check-on' : 'verse-check'} aria-hidden="true">
                            <Icon name="check" size={12} strokeWidth={3} />
                        </span>
                    ) : null}
                    {showVerseNumbers ? <span className="verse-num">{entry.label}</span> : null}
                    <span className="verse-text">{entry.text}</span>
                    {markerIcons(entry)}
                </div>
            );
        });
        flush();
        return blocks;
    };

    const selectedEntries = entries.filter(entry => selected.includes(entry.key));
    const selectionReference = selectedEntries.length > 0 ? `${bookTitle} ${numericChapter}:${rangeLabel(selectedEntries)}` : '';
    const selectionBody = [...selectedEntries]
        .sort((left, right) => left.start - right.start)
        .map(entry => (selectedEntries.length > 1 ? `${entry.label} ${entry.text}` : entry.text))
        .join('\n');
    const selectionUrl = readerShareUrl(bookId, numericChapter, selectedEntries[0]?.start);
    const allSelectedBookmarked = selectedEntries.length > 0 && selectedEntries.every(entry => markers.bookmarks.has(entry.key));

    const endSelection = () => {
        setSelectMode(false);
        setSelected([]);
        setBulkColorsOpen(false);
    };

    const payloadFor = (entry: ReaderVerse) => ({
        key: entry.key,
        bookId,
        chapter: numericChapter,
        verse: entry.start,
        label: entry.label,
        text: entry.text
    });

    const bulkCopy = async () => {
        if (await copyText(`${formatCitation(selectionReference, selectionBody)}\n${selectionUrl}`)) toast(ui.copied);
        endSelection();
    };

    const bulkShare = async () => {
        const outcome = await sharePassage(selectionReference, selectionBody, selectionUrl);
        if (outcome === 'copied') toast(ui.copied);
        if (outcome !== 'cancelled') endSelection();
    };

    const bulkBookmark = () => {
        selectedEntries.forEach(entry => setBookmarked(payloadFor(entry), !allSelectedBookmarked));
        toast(allSelectedBookmarked ? ui.bookmarkRemoved : ui.bookmarkAdded);
        endSelection();
    };

    const bulkHighlight = (color: HighlightColor | null) => {
        selectedEntries.forEach(entry => {
            if (color == null) removeHighlight(entry.key);
            else if (markers.highlights.get(entry.key) !== color) toggleHighlight(payloadFor(entry), color);
        });
        toast(color ? ui.highlighted : ui.removeHighlight);
        endSelection();
    };

    const fontSize = `calc(17px * ${fontScale})`;
    const chromeClass = chromeHidden ? 'reader-chrome-hidden' : '';

    return (
        <section
            className={`reader ${chromeClass} reader-font-${readerFont} reader-layout-${readerLayout}${compareMode ? ' reader-compare' : ''}`}
            style={{'--reader-size': fontSize, '--reader-leading': lineHeightScale} as React.CSSProperties}
        >
            <header className="reader-bar">
                <Link className="bar-btn" to={book ? `/books/${book.id}` : '/'} aria-label={ui.back}>
                    <Icon name="chevron_left" size={24} strokeWidth={2.2} />
                </Link>
                <button type="button" className="reader-title" onClick={() => setJumpOpen(true)} aria-haspopup="dialog">
                    <span className="reader-title-text">{book ? `${bookTitle} ${numericChapter}` : '…'}</span>
                    <Icon name="expand_more" size={16} strokeWidth={2.4} />
                </button>
                <button type="button" className="bar-btn" onClick={() => setOptionsOpen(true)} aria-label={ui.readingOptions} aria-haspopup="dialog">
                    <Icon name="text_size" size={22} />
                </button>
            </header>

            <div className="reader-panes" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                <article className="reader-pane" lang="ti" aria-busy={loadState === 'loading'}>
                    <header className="chapter-head">
                        <p className="chapter-book">{bookTitle}</p>
                        <h1 className="chapter-number">{numericChapter}</h1>
                    </header>

                    {loadState === 'loading' ? (
                        <div className="reader-skeleton" aria-label={ui.loading}>
                            {Array.from({length: 9}).map((_, index) => (
                                <span key={index} className="skeleton-line" style={{width: `${70 + ((index * 37) % 30)}%`}} />
                            ))}
                        </div>
                    ) : null}

                    {loadState === 'error' ? (
                        <div className="reader-error">
                            <Icon name="offline" size={28} />
                            <p>{navigator.onLine ? ui.chapterUnavailable : ui.chapterUnavailableOffline}</p>
                            <button type="button" className="btn btn-tinted" onClick={() => setReloadToken(value => value + 1)}>
                                <Icon name="refresh" size={16} />
                                {ui.retry}
                            </button>
                        </div>
                    ) : null}

                    {loadState === 'ready' ? <div className="scripture">{renderVerses(rows, entryByRow, true, 'main')}</div> : null}

                    {loadState === 'ready' ? (
                        <footer className="chapter-end" ref={endRef}>
                            <button
                                type="button"
                                className={isRead ? 'read-toggle read-toggle-on' : 'read-toggle'}
                                aria-pressed={isRead}
                                onClick={() => (isRead ? unmarkChapter(bookId, numericChapter) : markChapterRead(bookId, numericChapter))}
                            >
                                <Icon name={isRead ? 'check_circle' : 'book_check'} size={18} />
                                {isRead ? ui.markedRead : ui.markAsRead}
                            </button>
                            {nextTarget ? (
                                <button type="button" className="next-card" onClick={() => goTo(nextTarget)}>
                                    <span className="next-card-label">{ui.nextChapter}</span>
                                    <span className="next-card-title">
                                        {nextTarget.book.title} {nextTarget.chapter}
                                    </span>
                                    <Icon name="chevron_right" size={20} className="next-card-chevron" />
                                </button>
                            ) : (
                                <p className="muted-text">{ui.endOfBible}</p>
                            )}
                            {prevTarget ? (
                                <button type="button" className="btn btn-plain" onClick={() => goTo(prevTarget)}>
                                    <Icon name="chevron_left" size={16} />
                                    {prevTarget.book.title} {prevTarget.chapter}
                                </button>
                            ) : null}
                        </footer>
                    ) : null}
                </article>

                {compareMode ? (
                    <article className="reader-pane reader-pane-compare" lang="ti">
                        <header className="compare-head">
                            <span className="compare-label">{ui.compareWith}</span>
                            <div className="compare-selects">
                                <select
                                    className="field field-select"
                                    value={compareBookId}
                                    aria-label={ui.books}
                                    onChange={event => {
                                        const next = books.find(item => item.id === event.target.value);
                                        setCompareBookId(event.target.value);
                                        setCompareChapter(current => Math.min(current, next?.chaptersNum ?? 1));
                                    }}
                                >
                                    {books.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.title}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="field field-select field-select-narrow"
                                    value={compareChapter}
                                    aria-label={ui.chapter}
                                    onChange={event => setCompareChapter(Number(event.target.value))}
                                >
                                    {Array.from({length: compareBook?.chaptersNum ?? 1}, (_, index) => index + 1).map(value => (
                                        <option key={value} value={value}>
                                            {value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </header>
                        <div className="scripture">{renderVerses(compareRows, compareEntryByRow, false, 'compare')}</div>
                    </article>
                ) : null}
            </div>

            {!selectMode ? (
                <nav className="chapter-nav" aria-label={ui.chapters}>
                    <button type="button" className="chapter-nav-btn" onClick={() => goTo(prevTarget)} disabled={!prevTarget} aria-label={ui.previousChapter}>
                        <Icon name="chevron_left" size={22} strokeWidth={2.2} />
                    </button>
                    <button type="button" className="chapter-nav-btn" onClick={() => goTo(nextTarget)} disabled={!nextTarget} aria-label={ui.nextChapter}>
                        <Icon name="chevron_right" size={22} strokeWidth={2.2} />
                    </button>
                </nav>
            ) : (
                <div className="selection-bar" role="toolbar" aria-label={ui.verseActions}>
                    {bulkColorsOpen ? (
                        <div className="selection-colors">
                            {HIGHLIGHT_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`swatch swatch-${color}`}
                                    aria-label={colorLabel(ui, color)}
                                    onClick={() => bulkHighlight(color)}
                                />
                            ))}
                            <button type="button" className="swatch swatch-none" aria-label={ui.removeHighlight} onClick={() => bulkHighlight(null)}>
                                <Icon name="close" size={14} strokeWidth={2.5} />
                            </button>
                        </div>
                    ) : null}
                    <div className="selection-main">
                        <span className="selection-count">{selected.length > 0 ? ui.selectedCount(selected.length) : ui.selectVerses}</span>
                        <div className="selection-actions">
                            <button type="button" className="selection-btn" disabled={selected.length === 0} onClick={() => void bulkCopy()} aria-label={ui.copy}>
                                <Icon name="copy" size={20} />
                            </button>
                            <button type="button" className="selection-btn" disabled={selected.length === 0} onClick={() => void bulkShare()} aria-label={ui.share}>
                                <Icon name="share" size={20} />
                            </button>
                            <button
                                type="button"
                                className={bulkColorsOpen ? 'selection-btn selection-btn-on' : 'selection-btn'}
                                disabled={selected.length === 0}
                                onClick={() => setBulkColorsOpen(value => !value)}
                                aria-label={ui.highlight}
                                aria-expanded={bulkColorsOpen}
                            >
                                <Icon name="highlighter" size={20} />
                            </button>
                            <button type="button" className="selection-btn" disabled={selected.length === 0} onClick={bulkBookmark} aria-label={ui.bookmark}>
                                <Icon name="bookmark" size={20} fill={allSelectedBookmarked ? 'currentColor' : 'none'} />
                            </button>
                            <button type="button" className="selection-done" onClick={endSelection}>
                                {ui.done}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <JumpSheet
                open={jumpOpen}
                onClose={() => setJumpOpen(false)}
                books={books}
                currentBookId={bookId}
                currentChapter={numericChapter}
                readChapters={readChapters}
                onSelect={(nextBook, nextChapter) => navigate(`/reader/${nextBook}/${nextChapter}`)}
                ui={ui}
                showEnglish={systemLanguage === 'en'}
            />
            <ReadingOptionsSheet
                open={optionsOpen}
                onClose={() => setOptionsOpen(false)}
                ui={ui}
                compareMode={compareMode}
                onCompareMode={setCompareMode}
                onSelectVerses={() => setSelectMode(true)}
                onOpenThemes={() => setThemeOpen(true)}
            />
            <ThemeSheet open={themeOpen} onClose={() => setThemeOpen(false)} />
            <VerseSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                verse={sheetVerse}
                bookId={bookId}
                chapter={numericChapter}
                bookTitle={bookTitle}
                books={books}
                language={language}
                ui={ui}
                onStartSelect={key => {
                    setSelectMode(true);
                    setSelected([key]);
                }}
            />
        </section>
    );
}
