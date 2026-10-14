import {useEffect, useMemo, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {loadBooks} from '../data/api';
import {Book} from '../types/bible';
import {useSettingsStore} from '../store/settingsStore';
import {getUi} from '../i18n/ui';

export default function BooksPage() {
    const {bookId = ''} = useParams();
    const language = useSettingsStore(state => state.language);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);
    const [books, setBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        void loadBooks(language).then(bookList => {
            setBooks(bookList);
            setIsLoading(false);
        });
    }, [language]);

    const book = useMemo(() => books.find(item => item.id === bookId) ?? null, [books, bookId]);

    if (isLoading) {
        return (
            <section className="stack-lg">
                <div className="panel hero-panel stack-sm">
                    <div className="skeleton" style={{height: '4.5rem'}}/>
                    <div className="skeleton" style={{height: '2rem', width: '40%'}}/>
                </div>
                <div className="panel">
                    <div className="chapter-grid">
                        {Array.from({length: 12}).map((_, index) => (
                            <div key={`chapter-skeleton-${index}`} className="chapter-pill skeleton"/>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (!book) {
        return (
            <section className="stack-lg">
                <div className="panel">
                    <h2>{ui.bookNotFound}</h2>
                    <p>{ui.bookUnavailable}</p>
                    <Link className="btn" to="/">
                        {ui.backToLibrary}
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className="stack-lg">
            <div className="panel hero-panel">
                <p className="eyebrow">{ui.library}</p>
                <h2>{book.title}</h2>
                <p className="muted">
                    {ui.chaptersCount(book.chaptersNum)} • {book.testament === 'old' ? ui.oldTestament : ui.newTestament}
                </p>
                <div className="row gap-sm wrap">
                    <Link className="btn" to="/">
                        {ui.backToLibrary}
                    </Link>
                    <Link className="btn btn-primary" to={`/reader/${book.id}/1`}>
                        {ui.startReading}
                    </Link>
                </div>
            </div>

            <div className="panel stack-sm">
                <div className="section-header">
                    <div>
                        <h3>{ui.chapters}</h3>
                        <p className="muted">{ui.chooseChapter}</p>
                    </div>
                </div>

                <div className="chapter-grid">
                    {Array.from({length: book.chaptersNum}, (_, index) => index + 1).map(chapter => (
                        <Link key={chapter} className="chapter-pill" to={`/reader/${book.id}/${chapter}`}>
                            {chapter}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
