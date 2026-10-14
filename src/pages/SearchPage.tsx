import {useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {compareCanonical, loadBooks} from '../data/api';
import type {Book} from '../types/bible';
import type {ScoredVerse, SearchResponse} from '../workers/searchWorker';
import {useSettingsStore} from '../store/settingsStore';
import {useSavedStore} from '../store/savedStore';
import {toast} from '../store/uiStore';
import {readerShareUrl, sharePassage} from '../lib/site';
import {getUi, type UiStrings} from '../i18n/ui';
import Icon from '../components/Icon';
import Sheet from '../components/Sheet';
import {EmptyState, ListGroup, ListRow, PageHeader, Segmented, Switch} from '../components/ui';

const PAGE_SIZE = 40;
const SUGGESTIONS = ['ፍቕሪ', 'ሰላም', 'እምነት', 'ተስፋ', 'ጸሎት', 'ምሕረት', 'ጥበብ', 'ብርሃን'];

const highlightMatches = (text: string, terms: string[]): ReactNode => {
    const needles = terms.filter(Boolean).sort((left, right) => right.length - left.length);
    if (needles.length === 0) return text;
    const lower = text.toLocaleLowerCase();
    const parts: ReactNode[] = [];
    let cursor = 0;
    while (cursor < text.length) {
        let best = -1;
        let bestLength = 0;
        for (const needle of needles) {
            const index = lower.indexOf(needle, cursor);
            if (index !== -1 && (best === -1 || index < best || (index === best && needle.length > bestLength))) {
                best = index;
                bestLength = needle.length;
            }
        }
        if (best === -1) break;
        if (best > cursor) parts.push(text.slice(cursor, best));
        parts.push(<mark key={best}>{text.slice(best, best + bestLength)}</mark>);
        cursor = best + bestLength;
    }
    if (cursor < text.length) parts.push(text.slice(cursor));
    return parts;
};

type FilterSheetProps = {
    open: boolean;
    onClose: () => void;
    books: Book[];
    selected: Set<string>;
    onChange: (next: Set<string>) => void;
    exactPhrase: boolean;
    onExactPhrase: (value: boolean) => void;
    ui: UiStrings;
    showEnglish: boolean;
};

function FilterSheet({open, onClose, books, selected, onChange, exactPhrase, onExactPhrase, ui, showEnglish}: FilterSheetProps) {
    const groups: Array<{id: 'old' | 'new'; title: string; books: Book[]}> = [
        {id: 'old', title: ui.oldTestament, books: books.filter(book => book.testament === 'old')},
        {id: 'new', title: ui.newTestament, books: books.filter(book => book.testament === 'new')}
    ];

    const toggle = (bookId: string) => {
        const next = new Set(selected);
        if (next.has(bookId)) next.delete(bookId);
        else next.add(bookId);
        onChange(next);
    };

    const toggleGroup = (groupBooks: Book[]) => {
        const next = new Set(selected);
        const allOn = groupBooks.every(book => next.has(book.id));
        groupBooks.forEach(book => (allOn ? next.delete(book.id) : next.add(book.id)));
        onChange(next);
    };

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={ui.filters}
            size="tall"
            closeLabel={ui.close}
            footer={
                <div className="button-row button-row-spread">
                    <button
                        type="button"
                        className="btn btn-plain"
                        disabled={selected.size === 0 && !exactPhrase}
                        onClick={() => {
                            onChange(new Set());
                            onExactPhrase(false);
                        }}
                    >
                        {ui.clearFilters}
                    </button>
                    <button type="button" className="btn btn-filled" onClick={onClose}>
                        {ui.done}
                    </button>
                </div>
            }
        >
            <ListGroup footer={ui.exactPhraseHint}>
                <ListRow title={ui.exactPhrase} accessory={<Switch checked={exactPhrase} onChange={onExactPhrase} label={ui.exactPhrase} />} />
            </ListGroup>
            {groups.map(group => {
                const allOn = group.books.length > 0 && group.books.every(book => selected.has(book.id));
                return (
                    <section key={group.id} className="filter-group">
                        <div className="filter-group-head">
                            <h3>{group.title}</h3>
                            <button type="button" className="btn btn-plain btn-small" onClick={() => toggleGroup(group.books)}>
                                {allOn ? ui.clear : ui.selectAll}
                            </button>
                        </div>
                        <div className="filter-books">
                            {group.books.map(book => {
                                const on = selected.has(book.id);
                                return (
                                    <button
                                        key={book.id}
                                        type="button"
                                        className={on ? 'filter-book filter-book-on' : 'filter-book'}
                                        aria-pressed={on}
                                        onClick={() => toggle(book.id)}
                                    >
                                        <span className="filter-book-check" aria-hidden="true">
                                            {on ? <Icon name="check" size={12} strokeWidth={3} /> : null}
                                        </span>
                                        <span className="filter-book-name" lang="ti">
                                            {book.title}
                                        </span>
                                        {showEnglish ? <span className="filter-book-sub">{book.engname}</span> : null}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </Sheet>
    );
}

export default function SearchPage() {
    const language = useSettingsStore(state => state.language);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const recentSearches = useSettingsStore(state => state.recentSearches);
    const addRecentSearch = useSettingsStore(state => state.addRecentSearch);
    const removeRecentSearch = useSettingsStore(state => state.removeRecentSearch);
    const clearRecentSearches = useSettingsStore(state => state.clearRecentSearches);
    const exactPhrase = useSettingsStore(state => state.searchExactPhrase);
    const setExactPhrase = useSettingsStore(state => state.setSearchExactPhrase);
    const savedVerses = useSavedStore(state => state.verses);
    const setBookmarked = useSavedStore(state => state.setBookmarked);
    const ui = getUi(systemLanguage);
    const [params, setParams] = useSearchParams();
    const [query, setQuery] = useState(params.get('q') ?? '');
    const [debounced, setDebounced] = useState(query);
    const [books, setBooks] = useState<Book[]>([]);
    const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
    const [sort, setSort] = useState<'relevance' | 'canonical'>('relevance');
    const [response, setResponse] = useState<SearchResponse | null>(null);
    const [searching, setSearching] = useState(false);
    const [visible, setVisible] = useState(PAGE_SIZE);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const workerRef = useRef<Worker | null>(null);
    const requestRef = useRef(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        void loadBooks(language).then(setBooks);
    }, [language]);

    useEffect(() => {
        const worker = new Worker(new URL('../workers/searchWorker.ts', import.meta.url), {type: 'module'});
        worker.onmessage = event => {
            const payload = event.data as SearchResponse;
            if (payload.type !== 'results' || payload.requestId !== requestRef.current) return;
            setResponse(payload);
            setSearching(false);
            setVisible(PAGE_SIZE);
        };
        workerRef.current = worker;
        return () => {
            worker.terminate();
            workerRef.current = null;
        };
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => setDebounced(query), 250);
        return () => window.clearTimeout(timer);
    }, [query]);

    const setParamsRef = useRef(setParams);
    setParamsRef.current = setParams;
    useEffect(() => {
        const trimmed = debounced.trim();
        setParamsRef.current(trimmed ? {q: trimmed} : {}, {replace: true});
    }, [debounced]);

    useEffect(() => {
        const trimmed = debounced.trim();
        if (!workerRef.current || books.length === 0) return;
        if (!trimmed) {
            requestRef.current += 1;
            setResponse(null);
            setSearching(false);
            return;
        }
        const quoted = trimmed.length > 2 && trimmed.startsWith('"') && trimmed.endsWith('"');
        requestRef.current += 1;
        setSearching(true);
        workerRef.current.postMessage({
            type: 'search',
            requestId: requestRef.current,
            language,
            query: quoted ? trimmed.slice(1, -1) : trimmed,
            books: books.filter(book => selectedBooks.size === 0 || selectedBooks.has(book.id)).map(book => book.id),
            exactPhrase: exactPhrase || quoted,
            limit: 400
        });
    }, [debounced, books, selectedBooks, exactPhrase, language]);

    const titles = useMemo(() => new Map(books.map(book => [book.id, book.title])), [books]);
    const bookmarked = useMemo(() => new Set(savedVerses.filter(item => item.kind === 'bookmark').map(item => item.key)), [savedVerses]);
    const terms = useMemo(() => {
        const trimmed = debounced.trim().replace(/^"|"$/g, '').toLocaleLowerCase();
        return exactPhrase ? [trimmed] : trimmed.split(/\s+/).filter(Boolean);
    }, [debounced, exactPhrase]);

    const results: ScoredVerse[] = useMemo(() => {
        const list = response?.results ?? [];
        return sort === 'canonical' ? [...list].sort(compareCanonical) : list;
    }, [response, sort]);

    const run = (value: string) => {
        setQuery(value);
        setDebounced(value);
        addRecentSearch(value);
        inputRef.current?.blur();
    };

    const share = async (verse: ScoredVerse) => {
        const reference = `${titles.get(verse.bookId) ?? verse.bookId} ${verse.chapter}:${verse.label ?? verse.verse}`;
        const outcome = await sharePassage(reference, verse.text, readerShareUrl(verse.bookId, verse.chapter, verse.verse));
        if (outcome === 'copied') toast(ui.copied);
    };

    const filterCount = (selectedBooks.size > 0 ? 1 : 0) + (exactPhrase ? 1 : 0);
    const hasQuery = debounced.trim().length > 0;

    return (
        <section className="page search-page">
            <PageHeader title={ui.search} />
            <div className="search-bar">
                <form
                    className="search-field"
                    role="search"
                    onSubmit={event => {
                        event.preventDefault();
                        if (query.trim()) run(query.trim());
                    }}
                >
                    <Icon name="search" size={18} />
                    <input
                        ref={inputRef}
                        type="search"
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        placeholder={ui.searchPlaceholder}
                        aria-label={ui.search}
                        enterKeyHint="search"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        lang="ti"
                    />
                    {query ? (
                        <button type="button" className="search-clear" aria-label={ui.clear} onClick={() => setQuery('')}>
                            <Icon name="close" size={12} strokeWidth={3} />
                        </button>
                    ) : null}
                </form>
                <button
                    type="button"
                    className={filterCount > 0 ? 'icon-btn icon-btn-tinted filter-btn filter-btn-on' : 'icon-btn filter-btn'}
                    onClick={() => setFiltersOpen(true)}
                    aria-label={ui.filters}
                >
                    <Icon name="filter" size={19} />
                    {filterCount > 0 ? <span className="filter-badge">{filterCount}</span> : null}
                </button>
            </div>

            {selectedBooks.size > 0 || exactPhrase ? (
                <div className="active-filters">
                    {exactPhrase ? (
                        <button type="button" className="chip chip-on" onClick={() => setExactPhrase(false)}>
                            {ui.exactPhrase}
                            <Icon name="close" size={12} strokeWidth={3} />
                        </button>
                    ) : null}
                    {selectedBooks.size > 0 ? (
                        <button type="button" className="chip chip-on" onClick={() => setSelectedBooks(new Set())}>
                            {selectedBooks.size <= 2
                                ? [...selectedBooks].map(id => titles.get(id) ?? id).join(', ')
                                : ui.inBooks(selectedBooks.size)}
                            <Icon name="close" size={12} strokeWidth={3} />
                        </button>
                    ) : null}
                </div>
            ) : null}

            {!hasQuery ? (
                <div className="search-idle">
                    {recentSearches.length > 0 ? (
                        <section>
                            <div className="section-head">
                                <h2 className="section-title section-title-small">{ui.recentSearches}</h2>
                                <button type="button" className="btn btn-plain btn-small" onClick={clearRecentSearches}>
                                    {ui.clear}
                                </button>
                            </div>
                            <div className="list-group-body">
                                {recentSearches.map(item => (
                                    <div key={item} className="list-row list-row-interactive recent-row">
                                        <button type="button" className="recent-main" onClick={() => run(item)}>
                                            <Icon name="history" size={16} className="row-chevron" />
                                            <span className="row-title" lang="ti">
                                                {item}
                                            </span>
                                        </button>
                                        <button type="button" className="recent-remove" aria-label={ui.remove} onClick={() => removeRecentSearch(item)}>
                                            <Icon name="close" size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}
                    <section>
                        <h2 className="section-title section-title-small">{ui.suggestions}</h2>
                        <div className="chip-wrap">
                            {SUGGESTIONS.map(word => (
                                <button key={word} type="button" className="chip chip-large" lang="ti" onClick={() => run(word)}>
                                    {word}
                                </button>
                            ))}
                        </div>
                    </section>
                    <p className="muted-text search-hint">
                        <Icon name="offline" size={14} /> {ui.searchHint}
                    </p>
                </div>
            ) : (
                <div className="search-results">
                    <div className="results-head">
                        <span className="results-count" aria-live="polite">
                            {searching ? ui.searching : response ? ui.resultsCount(response.total, false) : ''}
                        </span>
                        <Segmented
                            value={sort}
                            onChange={setSort}
                            label={ui.results}
                            options={[
                                {value: 'relevance', label: ui.relevance},
                                {value: 'canonical', label: ui.bibleOrder}
                            ]}
                        />
                    </div>

                    {!searching && response && response.total === 0 ? (
                        <EmptyState
                            icon="search"
                            title={ui.noResults}
                            body={ui.noResultsHint}
                            action={
                                filterCount > 0 ? (
                                    <button
                                        type="button"
                                        className="btn btn-tinted"
                                        onClick={() => {
                                            setSelectedBooks(new Set());
                                            setExactPhrase(false);
                                        }}
                                    >
                                        {ui.clearFilters}
                                    </button>
                                ) : null
                            }
                        />
                    ) : null}

                    <ol className={searching ? 'result-list result-list-stale' : 'result-list'}>
                        {results.slice(0, visible).map(result => {
                            const isBookmarked = bookmarked.has(result.key);
                            return (
                                <li key={result.key} className="result">
                                    <Link
                                        className="result-link"
                                        to={`/reader/${result.bookId}/${result.chapter}`}
                                        state={{targetKey: result.key}}
                                        onClick={() => addRecentSearch(debounced)}
                                    >
                                        <span className="result-ref">
                                            {titles.get(result.bookId) ?? result.bookId} {result.chapter}:{result.label ?? result.verse}
                                        </span>
                                        <span className="result-text" lang="ti">
                                            {highlightMatches(result.text, terms)}
                                        </span>
                                    </Link>
                                    <div className="result-actions">
                                        <button
                                            type="button"
                                            className={isBookmarked ? 'icon-btn icon-btn-small icon-btn-on' : 'icon-btn icon-btn-small'}
                                            aria-label={ui.bookmark}
                                            aria-pressed={isBookmarked}
                                            onClick={() => {
                                                setBookmarked(
                                                    {key: result.key, bookId: result.bookId, chapter: result.chapter, verse: result.verse, label: result.label, text: result.text},
                                                    !isBookmarked
                                                );
                                                toast(isBookmarked ? ui.bookmarkRemoved : ui.bookmarkAdded);
                                            }}
                                        >
                                            <Icon name="bookmark" size={17} fill={isBookmarked ? 'currentColor' : 'none'} />
                                        </button>
                                        <button type="button" className="icon-btn icon-btn-small" aria-label={ui.share} onClick={() => void share(result)}>
                                            <Icon name="share" size={17} />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>

                    {results.length > visible ? (
                        <button type="button" className="btn btn-tinted btn-block" onClick={() => setVisible(count => count + PAGE_SIZE)}>
                            {ui.loadMore}
                        </button>
                    ) : null}
                </div>
            )}

            <FilterSheet
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                books={books}
                selected={selectedBooks}
                onChange={setSelectedBooks}
                exactPhrase={exactPhrase}
                onExactPhrase={setExactPhrase}
                ui={ui}
                showEnglish={systemLanguage === 'en'}
            />
        </section>
    );
}
