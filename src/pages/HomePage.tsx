import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {loadBooks} from '../data/api';
import {Book} from '../types/bible';
import {useSettingsStore} from '../store/settingsStore';

export default function HomePage() {
    const language = useSettingsStore(state => state.language);
    const [books, setBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [testamentView, setTestamentView] = useState<'all' | 'old' | 'new'>('all');

    useEffect(() => {
        setIsLoading(true);
        void loadBooks(language).then(bookList => {
            setBooks(bookList);
            setIsLoading(false);
        });
    }, [language]);

    const oldBooks = useMemo(() => books.filter(book => book.testament === 'old'), [books]);
    const newBooks = useMemo(() => books.filter(book => book.testament === 'new'), [books]);

    const visibleBooks =
        testamentView === 'old' ? oldBooks : testamentView === 'new' ? newBooks : books;

    const renderBookTiles = (items: Book[]) => (
        <div className="book-grid">
            {items.map(book => (
                <Link key={book.id} className="book-tile" to={`/books/${book.id}`}>
                    <strong>{book.title}</strong>
                    <span>{book.chaptersNum} chapters</span>
                </Link>
            ))}
        </div>
    );

    return (
        <section className="stack-lg">
            <div className="panel stack-sm">
                <div className="section-header">
                    <div>
                        <p className="eyebrow">Library</p>
                        <h3>Books</h3>
                    </div>
                    <div className="row gap-sm wrap">
                        <button
                            className={testamentView === 'all' ? 'chip chip-active-collection' : 'chip'}
                            type="button"
                            onClick={() => setTestamentView('all')}
                        >
                            All
                        </button>
                        <button
                            className={testamentView === 'old' ? 'chip chip-active-collection' : 'chip'}
                            type="button"
                            onClick={() => setTestamentView('old')}
                        >
                            Old Testament
                        </button>
                        <button
                            className={testamentView === 'new' ? 'chip chip-active-collection' : 'chip'}
                            type="button"
                            onClick={() => setTestamentView('new')}
                        >
                            New Testament
                        </button>
                        <Link className="btn" to="/search">Search</Link>
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
                            <h4 className="library-section-title">Old Testament</h4>
                            {renderBookTiles(oldBooks)}
                        </section>
                        <section className="library-section">
                            <h4 className="library-section-title">New Testament</h4>
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
