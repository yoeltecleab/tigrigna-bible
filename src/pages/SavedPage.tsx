import {Link} from 'react-router-dom';
import {useSavedStore} from '../store/savedStore';
import {useEffect, useMemo, useState} from 'react';
import {loadBooks} from '../data/api';
import {Book} from '../types/bible';
import {useSettingsStore} from '../store/settingsStore';
import {getUi} from '../i18n/ui';

export default function SavedPage() {
    const language = useSettingsStore(state => state.language);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);
    const verses = useSavedStore(state => state.verses);
    const collections = useSavedStore(state => state.collections);
    const collectionItems = useSavedStore(state => state.collectionItems);
    const notes = useSavedStore(state => state.notes);
    const bookmarkCount = verses.filter(item => item.kind === 'bookmark').length;
    const highlightCount = verses.filter(item => item.kind === 'highlight').length;
    const [activeFilter, setActiveFilter] = useState<'all' | 'bookmark' | 'highlight' | 'collection' | 'note'>('all');
    const [books, setBooks] = useState<Book[]>([]);

    useEffect(() => {
        void loadBooks(language).then(setBooks);
    }, [language]);

    const booksMap = useMemo(() => new Map(books.map(book => [book.id, book.title])), [books]);
    const titleFor = (bookId: string) => booksMap.get(bookId) ?? bookId;

    const filteredVerses = useMemo(() => {
        if (activeFilter === 'all' || activeFilter === 'collection' || activeFilter === 'note') {
            return verses;
        }

        if (activeFilter === 'bookmark' || activeFilter === 'highlight') {
            return verses.filter(item => item.kind === activeFilter);
        }

        return [];
    }, [verses, activeFilter]);

    const visibleCollectionItems = useMemo(
        () => (activeFilter === 'all' || activeFilter === 'collection' ? collectionItems : []),
        [collectionItems, activeFilter]
    );

    const visibleNotes = useMemo(
        () => (activeFilter === 'all' || activeFilter === 'note' ? notes : []),
        [notes, activeFilter]
    );

    const hasVisibleContent = filteredVerses.length > 0 || visibleCollectionItems.length > 0 || visibleNotes.length > 0;

    return (
        <section className="stack-lg">
            <div className="panel stack-sm">
                <div className="section-header">
                    <div>
                        <p className="eyebrow">{ui.journey}</p>
                        <h3>{ui.savedVerses}</h3>
                    </div>
                    <span className="muted">
                        {bookmarkCount} · {highlightCount} · {notes.length}
                    </span>
                </div>

                <div className="row gap-sm wrap">
                    <button
                        type="button"
                        className={activeFilter === 'all' ? 'chip chip-active-collection' : 'chip'}
                        onClick={() => setActiveFilter('all')}
                    >
                        {ui.all}
                    </button>
                    <button
                        type="button"
                        className={activeFilter === 'bookmark' ? 'chip chip-active-bookmark' : 'chip chip-bookmark'}
                        onClick={() => setActiveFilter('bookmark')}
                    >
                        {ui.bookmark}
                    </button>
                    <button
                        type="button"
                        className={activeFilter === 'highlight' ? 'chip chip-active-highlight' : 'chip chip-highlight'}
                        onClick={() => setActiveFilter('highlight')}
                    >
                        {ui.highlight}
                    </button>
                    <button
                        type="button"
                        className={activeFilter === 'collection' ? 'chip chip-active-collection' : 'chip chip-collection'}
                        onClick={() => setActiveFilter('collection')}
                    >
                        {ui.collection}
                    </button>
                    <button
                        type="button"
                        className={activeFilter === 'note' ? 'chip chip-active-collection' : 'chip'}
                        onClick={() => setActiveFilter('note')}
                    >
                        {ui.note}
                    </button>
                </div>

                {!hasVisibleContent && <p>{ui.noSavedYet}</p>}

                <div className="stack-sm">
                    {filteredVerses.map(item => (
                        <article className="verse-card" key={`${item.kind}-${item.key}`}>
                            <p className="meta">
                                <span className={item.kind === 'bookmark' ? 'save-kind save-kind-bookmark' : 'save-kind save-kind-highlight'}>
                                    {item.kind === 'bookmark' ? ui.bookmark : ui.highlight}
                                </span>
                            </p>
                            <p className="verse-text">{item.text}</p>
                            <footer className="verse-footer">
                                <span>
                                    {titleFor(item.bookId)} {item.chapter}:{item.verse}
                                </span>
                                <Link
                                    className="link-btn"
                                    to={`/reader/${item.bookId}/${item.chapter}`}
                                    state={{targetVerse: item.verse}}
                                >
                                    {ui.openChapter}
                                </Link>
                            </footer>
                        </article>
                    ))}

                    {visibleCollectionItems.map(item => {
                        const collection = collections.find(entry => entry.id === item.collectionId);
                        return (
                            <article className="verse-card" key={item.id}>
                                <p className="meta">
                                    <span className="save-kind save-kind-collection">{collection?.name ?? ui.collection}</span>
                                </p>
                                <p className="verse-text">{item.text}</p>
                                <footer className="verse-footer">
                                    <span>
                                        {titleFor(item.bookId)} {item.chapter}:{item.verse}
                                    </span>
                                    <Link
                                        className="link-btn"
                                        to={`/reader/${item.bookId}/${item.chapter}`}
                                        state={{targetVerse: item.verse}}
                                    >
                                        {ui.openChapter}
                                    </Link>
                                </footer>
                            </article>
                        );
                    })}

                    {visibleNotes.map(item => (
                        <article className="verse-card" key={item.id}>
                            <p className="meta">
                                <span className="save-kind save-kind-collection">{ui.note}</span>
                            </p>
                            <p className="verse-text">{item.note}</p>
                            <p className="meta">{item.text}</p>
                            <footer className="verse-footer">
                                <span>
                                    {titleFor(item.bookId)} {item.chapter}:{item.verse}
                                </span>
                                <Link
                                    className="link-btn"
                                    to={`/reader/${item.bookId}/${item.chapter}`}
                                    state={{targetVerse: item.verse}}
                                >
                                    {ui.openChapter}
                                </Link>
                            </footer>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
