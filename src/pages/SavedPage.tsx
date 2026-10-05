import {Link} from 'react-router-dom';
import {useSavedStore} from '../store/savedStore';
import {useMemo, useState} from 'react';

export default function SavedPage() {
    const verses = useSavedStore(state => state.verses);
    const collections = useSavedStore(state => state.collections);
    const collectionItems = useSavedStore(state => state.collectionItems);
    const notes = useSavedStore(state => state.notes);
    const bookmarkCount = verses.filter(item => item.kind === 'bookmark').length;
    const highlightCount = verses.filter(item => item.kind === 'highlight').length;
    const [activeFilter, setActiveFilter] = useState<'all' | 'bookmark' | 'highlight' | 'collection' | 'note'>('all');

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
                        <p className="eyebrow">Journey</p>
                        <h3>Bookmarks and highlights</h3>
                    </div>
                    <span className="muted">
                        {bookmarkCount} bookmarks • {highlightCount} highlights • {notes.length} notes
                    </span>
                </div>

                <div className="row gap-sm wrap">
                    <button
                        type="button"
                        className={activeFilter === 'all' ? 'chip chip-active-collection' : 'chip'}
                        onClick={() => setActiveFilter('all')}
                    >
                        All
                    </button>
                    <button
                        type="button"
                        className={activeFilter === 'bookmark' ? 'chip chip-active-bookmark' : 'chip chip-bookmark'}
                        onClick={() => setActiveFilter('bookmark')}
                    >
                        Bookmark
                    </button>
                    <button
                        type="button"
                        className={activeFilter === 'highlight' ? 'chip chip-active-highlight' : 'chip chip-highlight'}
                        onClick={() => setActiveFilter('highlight')}
                    >
                        Highlight
                    </button>
                    <button
                        type="button"
                        className={activeFilter === 'collection' ? 'chip chip-active-collection' : 'chip chip-collection'}
                        onClick={() => setActiveFilter('collection')}
                    >
                        Collection
                    </button>
                    <button
                        type="button"
                        className={activeFilter === 'note' ? 'chip chip-active-collection' : 'chip'}
                        onClick={() => setActiveFilter('note')}
                    >
                        Note
                    </button>
                </div>

                {!hasVisibleContent && <p>No saved items yet. Add a bookmark, highlight, collection link, or note.</p>}

                <div className="stack-sm">
                    {filteredVerses.map(item => (
                        <article className="verse-card" key={`${item.kind}-${item.key}`}>
                            <p className="meta">
                                <span className={item.kind === 'bookmark' ? 'save-kind save-kind-bookmark' : 'save-kind save-kind-highlight'}>
                                    {item.kind.toUpperCase()}
                                </span>
                            </p>
                            <p className="verse-text">{item.text}</p>
                            <footer className="verse-footer">
                                <span>
                                  {item.bookId} {item.chapter}:{item.verse}
                                </span>
                                <Link className="link-btn" to={`/reader/${item.bookId}/${item.chapter}`}>
                                    Open
                                </Link>
                            </footer>
                        </article>
                    ))}

                    {visibleCollectionItems.map(item => {
                            const collection = collections.find(entry => entry.id === item.collectionId);
                            return (
                                <article className="verse-card" key={item.id}>
                                    <p className="meta">
                                        <span className="save-kind save-kind-collection">{collection?.name ?? 'Collection'}</span>
                                    </p>
                                    <p className="verse-text">{item.text}</p>
                                    <footer className="verse-footer">
                                        <span>
                                            {item.bookId} {item.chapter}:{item.verse}
                                        </span>
                                        <Link className="link-btn" to={`/reader/${item.bookId}/${item.chapter}`} state={{targetVerse: item.verse}}>
                                            Open
                                        </Link>
                                    </footer>
                                </article>
                            );
                        })}

                    {visibleNotes.map(item => (
                        <article className="verse-card" key={item.id}>
                            <p className="meta">
                                <span className="save-kind save-kind-collection">NOTE</span>
                            </p>
                            <p className="verse-text">{item.note}</p>
                            <p className="meta">{item.text}</p>
                            <footer className="verse-footer">
                                <span>
                                    {item.bookId} {item.chapter}:{item.verse}
                                </span>
                                <Link className="link-btn" to={`/reader/${item.bookId}/${item.chapter}`} state={{targetVerse: item.verse}}>
                                    Open
                                </Link>
                            </footer>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
