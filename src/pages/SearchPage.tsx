import {useEffect, useMemo, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {loadBooks} from '../data/api';
import {Book, SearchVerse} from '../types/bible';
import {useSettingsStore} from '../store/settingsStore';
import {useSavedStore} from '../store/savedStore';
import {buildSharePayload, readerShareUrl} from '../lib/site';
import {getUi} from '../i18n/ui';
import Icon from '../components/Icon';

export default function SearchPage() {
    const language = useSettingsStore(state => state.language);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);
    const recentSearches = useSettingsStore(state => state.recentSearches);
    const addRecentSearch = useSettingsStore(state => state.addRecentSearch);
    const clearRecentSearches = useSettingsStore(state => state.clearRecentSearches);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
    const [resultSort, setResultSort] = useState<'relevance' | 'book'>('relevance');
    const [books, setBooks] = useState<Book[]>([]);
    const [results, setResults] = useState<SearchVerse[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const workerRef = useRef<Worker | null>(null);
    const requestIdRef = useRef(0);
    const toggleBookmark = useSavedStore(state => state.toggleBookmark);

    const popularTags = systemLanguage === 'ti'
        ? ['ፍቕሪ', 'ጸሎት', 'ሰላም', 'እምነት', 'ጥበብ', 'ምሕረት']
        : ['ፍቕሪ', 'ጸሎት', 'ሰላም', 'እምነት', 'ጥበብ', 'ምሕረት'];

    useEffect(() => {
        void loadBooks(language).then(setBooks);
    }, [language]);

    useEffect(() => {
        workerRef.current = new Worker(new URL('../workers/searchWorker.ts', import.meta.url), {type: 'module'});

        const worker = workerRef.current;
        worker.onmessage = event => {
            const payload = event.data as { type: 'results'; requestId: number; results: SearchVerse[] };
            if (payload.type !== 'results' || payload.requestId !== requestIdRef.current) {
                return;
            }

            setResults(payload.results);
            setIsSearching(false);
        };

        return () => {
            worker.terminate();
            workerRef.current = null;
        };
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedQuery(query);
        }, 220);

        return () => window.clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (!workerRef.current) {
            return;
        }

        if (!debouncedQuery.trim()) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        requestIdRef.current += 1;
        setIsSearching(true);
        workerRef.current.postMessage({
            type: 'search',
            requestId: requestIdRef.current,
            language,
            query: debouncedQuery,
            bookFilters: selectedBooks.length > 0 ? selectedBooks : undefined,
            books: books.map(book => book.id),
            limit: 300
        });
    }, [debouncedQuery, selectedBooks, books, language]);

    const bookTitleMap = useMemo(() => new Map(books.map(book => [book.id, book.title])), [books]);

    const toggleBookFilter = (bookId: string) => {
        setSelectedBooks(current => {
            if (current.includes(bookId)) {
                return current.filter(item => item !== bookId);
            }
            return [...current, bookId];
        });
    };

    const runSearch = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) {
            return;
        }

        setQuery(trimmed);
        setDebouncedQuery(trimmed);
        addRecentSearch(trimmed);
    };

    const visibleResults =
        resultSort === 'book' ? [...results].sort((left, right) => left.bookId.localeCompare(right.bookId)) : results;

    const shareVerse = async (verse: SearchVerse) => {
        const bookTitle = bookTitleMap.get(verse.bookId) ?? verse.bookId;
        const reference = `${bookTitle} ${verse.chapter}:${verse.verse}`;
        const url = readerShareUrl(verse.bookId, verse.chapter, verse.verse);
        const payload = buildSharePayload(reference, verse.text, url);

        try {
            if (navigator.share) {
                await navigator.share(payload);
                return;
            }

            if (navigator.clipboard) {
                await navigator.clipboard.writeText(payload.text);
            }
        } catch {
            // Swallow share cancellation/clipboard permission failures.
        }
    };

    return (
        <section className="stack-lg">
            <div className="panel hero-panel stack-sm">
                <p className="eyebrow">{ui.search}</p>
                <h2>{ui.seekingWisdom}</h2>
                <p className="muted">{ui.offlineSearchHint}</p>
                <div
                    className="search-input-wrap"
                    onKeyDown={event => {
                        if (event.key === 'Enter') {
                            runSearch(query);
                        }
                    }}
                >
                    <Icon name="search" size={20} />
                    <input
                        className="search-input"
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        placeholder={ui.seekingWisdom}
                        aria-label={ui.search}
                    />
                    <button className="icon-button mini" type="button" aria-label={ui.search} onClick={() => runSearch(query)}>
                        <Icon name="search" size={18} />
                    </button>
                </div>
                <div className="chips-row">
                    <button
                        className={selectedBooks.length === 0 ? 'chip-row-item chip-row-item-active' : 'chip-row-item'}
                        type="button"
                        onClick={() => setSelectedBooks([])}
                    >
                        {ui.allBooks}
                    </button>
                    {books.map(book => (
                        <button
                            key={book.id}
                            className={selectedBooks.includes(book.id) ? 'chip-row-item chip-row-item-active' : 'chip-row-item'}
                            type="button"
                            onClick={() => toggleBookFilter(book.id)}
                        >
                            {book.title}
                        </button>
                    ))}
                </div>
            </div>

            <div className="search-grid">
                <div className="panel search-side-card">
                    <div className="section-header">
                        <p className="eyebrow">{ui.recentSearches}</p>
                        {recentSearches.length > 0 ? (
                            <button className="link-btn" type="button" onClick={clearRecentSearches}>
                                {ui.clear}
                            </button>
                        ) : null}
                    </div>
                    <div className="stack-sm">
                        {recentSearches.length === 0 ? <p className="muted">—</p> : null}
                        {recentSearches.map(item => (
                            <button key={item} type="button" className="history-item" onClick={() => runSearch(item)}>
                                <span>{item}</span>
                                <Icon name="history" size={16} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="panel search-tags-card">
                    <p className="eyebrow">{ui.popularTags}</p>
                    <div className="tag-grid">
                        {popularTags.map((tag, index) => (
                            <button
                                key={tag}
                                className={`tag-pill tag-tone-${(index % 4) + 1}`}
                                type="button"
                                onClick={() => runSearch(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="stack-sm">
                <div className="section-header">
                    <div>
                        <p className="eyebrow">{ui.results}</p>
                        <h3>{query.trim() ? ui.foundInstances(visibleResults.length) : ui.results}</h3>
                        {selectedBooks.length > 0 ? (
                            <p className="meta">
                                {selectedBooks.length} {ui.book}
                            </p>
                        ) : null}
                    </div>
                    <label className="stack-xs sort-select-wrap">
                        <span className="muted">{ui.sortBy}</span>
                        <select
                            className="input"
                            value={resultSort}
                            onChange={event => setResultSort(event.target.value as 'relevance' | 'book')}
                        >
                            <option value="relevance">{ui.relevance}</option>
                            <option value="book">{ui.book}</option>
                        </select>
                    </label>
                </div>

                {isSearching && <p className="muted">{ui.searching}</p>}

                {visibleResults.slice(0, 50).map(result => (
                    <article className="panel scroll-result-card" key={result.key}>
                        <div className="scroll-result-head">
                            <div>
                                <p className="scroll-ref">
                                    {(bookTitleMap.get(result.bookId) ?? result.bookId)} {result.chapter}:{result.verse}
                                </p>
                            </div>
                            <div className="row gap-sm">
                                <button
                                    className="icon-button mini"
                                    type="button"
                                    aria-label={ui.bookmark}
                                    onClick={() =>
                                        toggleBookmark({
                                            key: result.key,
                                            bookId: result.bookId,
                                            chapter: result.chapter,
                                            verse: result.verse,
                                            text: result.text
                                        })
                                    }
                                >
                                    <Icon name="bookmark" size={18} />
                                    </button>
                                    <button
                                        className="icon-button mini"
                                        type="button"
                                        aria-label={ui.share}
                                        onClick={() => void shareVerse(result)}
                                    >
                                        <Icon name="share" size={18} />
                                </button>
                            </div>
                        </div>
                        <p className="scroll-verse verse-text">{result.text}</p>
                        <div className="row gap-sm wrap">
                            <Link
                                className="btn btn-primary"
                                to={`/reader/${result.bookId}/${result.chapter}`}
                                state={{targetVerse: result.verse, source: 'search'}}
                                onClick={() => {
                                    if (query.trim()) {
                                        addRecentSearch(query);
                                    }
                                }}
                            >
                                {ui.readChapter}
                            </Link>
                        </div>
                    </article>
                ))}

                {query && !isSearching && visibleResults.length === 0 ? <p>{ui.noResults}</p> : null}
            </div>
        </section>
    );
}
