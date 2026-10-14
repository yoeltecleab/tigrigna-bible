import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {loadBooks, resolveDailyVerse} from '../data/api';
import {Book, SearchVerse} from '../types/bible';
import {useSettingsStore} from '../store/settingsStore';
import {getUi} from '../i18n/ui';
import Icon from '../components/Icon';

export default function HomePage() {
    const language = useSettingsStore(state => state.language);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const lastReading = useSettingsStore(state => state.lastReading);
    const ui = getUi(systemLanguage);
    const [books, setBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [testamentView, setTestamentView] = useState<'all' | 'old' | 'new'>('all');
    const [dailyVerse, setDailyVerse] = useState<SearchVerse | null>(null);

    useEffect(() => {
        setIsLoading(true);
        void loadBooks(language).then(bookList => {
            setBooks(bookList);
            setIsLoading(false);
        });
    }, [language]);

    useEffect(() => {
        void resolveDailyVerse(language).then(setDailyVerse);
    }, [language]);

    const oldBooks = useMemo(() => books.filter(book => book.testament === 'old'), [books]);
    const newBooks = useMemo(() => books.filter(book => book.testament === 'new'), [books]);
    const booksMap = useMemo(() => new Map(books.map(book => [book.id, book])), [books]);

    const visibleBooks =
        testamentView === 'old' ? oldBooks : testamentView === 'new' ? newBooks : books;

    const continueBook = lastReading ? booksMap.get(lastReading.bookId) : null;
    const dailyBookTitle = dailyVerse ? booksMap.get(dailyVerse.bookId)?.title ?? dailyVerse.bookId : '';

    const renderBookTiles = (items: Book[]) => (
        <div className="book-grid">
            {items.map(book => (
                <Link key={book.id} className="book-tile" to={`/books/${book.id}`}>
                    <strong>{book.title}</strong>
                    <span>{ui.chaptersCount(book.chaptersNum)}</span>
                </Link>
            ))}
        </div>
    );

    return (
        <section className="stack-xl home-page">
            {dailyVerse ? (
                <Link
                    className="daily-hero"
                    to={`/reader/${dailyVerse.bookId}/${dailyVerse.chapter}`}
                    state={{targetVerse: dailyVerse.verse}}
                >
                    <div className="daily-hero-copy">
                        <p className="eyebrow">
                            <Icon name="star" size={16} className="eyebrow-icon" />
                            {ui.dailyVerse}
                        </p>
                        <p className="daily-hero-quote verse-text">{dailyVerse.text}</p>
                        <p className="daily-hero-ref">
                            {dailyBookTitle} {dailyVerse.chapter}:{dailyVerse.verse}
                        </p>
                        <span className="btn btn-primary card-cta">{ui.openChapter}</span>
                    </div>
                </Link>
            ) : null}

            {lastReading ? (
                <Link
                    className="resume-card clickable-card"
                    to={`/reader/${lastReading.bookId}/${lastReading.chapter}`}
                >
                    <div className="resume-icon" aria-hidden="true">
                        <Icon name="menu_book" size={22} />
                    </div>
                    <div className="stack-xs">
                        <p className="eyebrow">{ui.continueReading}</p>
                        <h3>
                            {continueBook ? `${continueBook.title} ${lastReading.chapter}` : '…'}
                        </h3>
                        <p className="link-arrow">{ui.resumeReading}</p>
                    </div>
                </Link>
            ) : (
                <div className="resume-card">
                    <div className="resume-icon" aria-hidden="true">
                        <Icon name="menu_book" size={22} />
                    </div>
                    <div className="stack-xs">
                        <p className="eyebrow">{ui.continueReading}</p>
                        <h3>{ui.theWord}</h3>
                        <Link className="btn btn-primary card-cta" to="/books/ZEFTRET">
                            {ui.startReading}
                        </Link>
                    </div>
                </div>
            )}

            <div className="library-surface stack-md">
                <div className="section-header library-header">
                    <div>
                        <p className="eyebrow">{ui.library}</p>
                        <h2 className="library-title">{ui.books}</h2>
                    </div>
                    <div className="segmented" role="tablist" aria-label={ui.library}>
                        <button
                            className={testamentView === 'all' ? 'segmented-item active' : 'segmented-item'}
                            type="button"
                            role="tab"
                            aria-selected={testamentView === 'all'}
                            onClick={() => setTestamentView('all')}
                        >
                            {ui.all}
                        </button>
                        <button
                            className={testamentView === 'old' ? 'segmented-item active' : 'segmented-item'}
                            type="button"
                            role="tab"
                            aria-selected={testamentView === 'old'}
                            onClick={() => setTestamentView('old')}
                        >
                            {ui.oldTestament}
                        </button>
                        <button
                            className={testamentView === 'new' ? 'segmented-item active' : 'segmented-item'}
                            type="button"
                            role="tab"
                            aria-selected={testamentView === 'new'}
                            onClick={() => setTestamentView('new')}
                        >
                            {ui.newTestament}
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="book-grid">
                        {Array.from({length: 10}).map((_, index) => (
                            <div key={`book-skeleton-${index}`} className="book-tile skeleton"/>
                        ))}
                    </div>
                ) : testamentView === 'all' ? (
                    <div className="library-sections">
                        <section className="library-section">
                            <h4 className="library-section-title">{ui.oldTestament}</h4>
                            {renderBookTiles(oldBooks)}
                        </section>
                        <section className="library-section">
                            <h4 className="library-section-title">{ui.newTestament}</h4>
                            {renderBookTiles(newBooks)}
                        </section>
                    </div>
                ) : (
                    renderBookTiles(visibleBooks)
                )}
            </div>
        </section>
    );
}
