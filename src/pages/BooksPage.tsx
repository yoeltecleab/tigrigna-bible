import {useEffect, useMemo, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {loadBooks} from '../data/api';
import type {Book} from '../types/bible';
import {useSettingsStore} from '../store/settingsStore';
import {chapterKey, useProgressStore} from '../store/progressStore';
import {getUi} from '../i18n/ui';
import Icon from '../components/Icon';
import {EmptyState, ProgressBar} from '../components/ui';

export default function BooksPage() {
    const {bookId = ''} = useParams();
    const language = useSettingsStore(state => state.language);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const lastReading = useSettingsStore(state => state.lastReading);
    const readChapters = useProgressStore(state => state.readChapters);
    const ui = getUi(systemLanguage);
    const [books, setBooks] = useState<Book[] | null>(null);

    useEffect(() => {
        void loadBooks(language).then(setBooks);
    }, [language]);

    const book = useMemo(() => books?.find(item => item.id === bookId) ?? null, [books, bookId]);

    if (books && !book) {
        return (
            <section className="page">
                <EmptyState
                    icon="menu_book"
                    title={ui.bookNotFound}
                    body={ui.bookUnavailable}
                    action={
                        <Link className="btn btn-tinted" to="/">
                            {ui.backToLibrary}
                        </Link>
                    }
                />
            </section>
        );
    }

    const chapters = Array.from({length: book?.chaptersNum ?? 0}, (_, index) => index + 1);
    const read = chapters.filter(chapter => readChapters[chapterKey(bookId, chapter)]).length;
    const resumeChapter =
        lastReading?.bookId === bookId ? lastReading.chapter : chapters.find(chapter => !readChapters[chapterKey(bookId, chapter)]) ?? 1;

    return (
        <section className="page books-page">
            <nav className="back-row">
                <Link className="back-link" to="/">
                    <Icon name="chevron_left" size={20} strokeWidth={2.2} />
                    {ui.library}
                </Link>
            </nav>
            <header className="page-header">
                <p className="page-eyebrow">{book ? (book.testament === 'old' ? ui.oldTestament : ui.newTestament) : ''}</p>
                <h1 className="page-title" lang="ti">
                    {book?.title ?? '…'}
                </h1>
                {book && systemLanguage === 'en' ? <p className="page-subtitle">{book.engname}</p> : null}
            </header>

            {book ? (
                <div className="card book-summary">
                    <div className="book-summary-row">
                        <span>{ui.chaptersReadOf(read, book.chaptersNum)}</span>
                        <span className="muted-text">{Math.round((read / book.chaptersNum) * 100)}%</span>
                    </div>
                    <ProgressBar value={(read / book.chaptersNum) * 100} label={book.title} />
                    <Link className="btn btn-filled btn-block" to={`/reader/${book.id}/${resumeChapter}`}>
                        <Icon name="menu_book" size={18} />
                        {read === 0 && lastReading?.bookId !== bookId ? ui.startReading : ui.continueAt(resumeChapter)}
                    </Link>
                </div>
            ) : null}

            <section>
                <h2 className="section-title">{ui.chapters}</h2>
                <div className="chapter-grid">
                    {book
                        ? chapters.map(chapter => {
                              const isRead = Boolean(readChapters[chapterKey(book.id, chapter)]);
                              return (
                                  <Link
                                      key={chapter}
                                      className={isRead ? 'chapter-cell chapter-cell-read' : 'chapter-cell'}
                                      to={`/reader/${book.id}/${chapter}`}
                                      aria-label={`${ui.chapter} ${chapter}${isRead ? ` · ${ui.markedRead}` : ''}`}
                                  >
                                      {chapter}
                                  </Link>
                              );
                          })
                        : Array.from({length: 20}).map((_, index) => <span key={index} className="chapter-cell chapter-cell-skeleton" />)}
                </div>
            </section>
        </section>
    );
}
