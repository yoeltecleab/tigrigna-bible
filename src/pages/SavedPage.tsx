import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {useSavedStore, type Collection, type VersePayload} from '../store/savedStore';
import {loadBooks} from '../data/api';
import type {Book} from '../types/bible';
import {useSettingsStore} from '../store/settingsStore';
import {toast} from '../store/uiStore';
import {describeStoredVerse} from '../lib/verseNormalize.js';
import {readerShareUrl, sharePassage} from '../lib/site';
import {collectionDisplayName, getUi} from '../i18n/ui';
import Icon from '../components/Icon';
import Sheet from '../components/Sheet';
import {EmptyState, PageHeader} from '../components/ui';

type Filter = 'all' | 'bookmark' | 'highlight' | 'note' | 'collections';

type Item = {
    id: string;
    kind: 'bookmark' | 'highlight' | 'note' | 'collection';
    payload: VersePayload;
    createdAt: string;
    color?: string;
    note?: string;
    collectionId?: string;
};

export default function SavedPage() {
    const language = useSettingsStore(state => state.language);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);
    const store = useSavedStore();
    const [books, setBooks] = useState<Book[]>([]);
    const [filter, setFilter] = useState<Filter>('all');
    const [openCollection, setOpenCollection] = useState<string | null>(null);
    const [managing, setManaging] = useState<Collection | null>(null);
    const [renameDraft, setRenameDraft] = useState('');

    useEffect(() => {
        void loadBooks(language).then(setBooks);
    }, [language]);

    const titles = useMemo(() => new Map(books.map(book => [book.id, book.title])), [books]);

    const items: Item[] = useMemo(() => {
        const list: Item[] = [
            ...store.verses.map(item => ({
                id: `${item.kind}:${item.key}`,
                kind: item.kind,
                payload: item,
                createdAt: item.createdAt,
                color: item.color ?? (item.kind === 'highlight' ? 'gold' : undefined)
            })),
            ...store.notes.map(item => ({id: item.id, kind: 'note' as const, payload: item, createdAt: item.updatedAt, note: item.note})),
            ...store.collectionItems.map(item => ({
                id: item.id,
                kind: 'collection' as const,
                payload: item,
                createdAt: item.createdAt,
                collectionId: item.collectionId
            }))
        ];
        return list.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    }, [store.verses, store.notes, store.collectionItems]);

    const counts = {
        all: store.verses.length + store.notes.length,
        bookmark: store.verses.filter(item => item.kind === 'bookmark').length,
        highlight: store.verses.filter(item => item.kind === 'highlight').length,
        note: store.notes.length,
        collections: store.collections.length
    };

    const visibleItems = items.filter(item => {
        if (filter === 'all') return item.kind !== 'collection';
        if (filter === 'collections') return item.kind === 'collection' && item.collectionId === openCollection;
        return item.kind === filter;
    });

    const reference = (payload: VersePayload) => `${titles.get(payload.bookId) ?? payload.bookId} ${payload.chapter}:${describeStoredVerse(payload).label}`;

    const remove = (item: Item) => {
        const snapshot = useSavedStore.getState();
        if (item.kind === 'bookmark' || item.kind === 'highlight') {
            store.removeSavedVerse(item.payload.key, item.kind);
        } else if (item.kind === 'note') {
            store.removeNote(item.payload.key);
        } else if (item.collectionId) {
            store.removeFromCollection(item.collectionId, item.payload.key);
        }
        toast(ui.removedItem, {
            label: ui.undo,
            onAction: () =>
                useSavedStore.setState({
                    verses: snapshot.verses,
                    notes: snapshot.notes,
                    collectionItems: snapshot.collectionItems
                })
        });
    };

    const share = async (payload: VersePayload) => {
        const {text} = describeStoredVerse(payload);
        const outcome = await sharePassage(reference(payload), text, readerShareUrl(payload.bookId, payload.chapter, payload.verse));
        if (outcome === 'copied') toast(ui.copied);
    };

    const filters: Array<{id: Filter; label: string; count: number}> = [
        {id: 'all', label: ui.all, count: counts.all},
        {id: 'bookmark', label: ui.bookmarks, count: counts.bookmark},
        {id: 'highlight', label: ui.highlights, count: counts.highlight},
        {id: 'note', label: ui.notes, count: counts.note},
        {id: 'collections', label: ui.collections, count: counts.collections}
    ];

    const activeCollection = store.collections.find(item => item.id === openCollection) ?? null;

    return (
        <section className="page saved-page">
            <PageHeader title={ui.savedTitle} />

            <div className="filter-scroller" role="tablist" aria-label={ui.savedTitle}>
                {filters.map(item => (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={filter === item.id}
                        className={filter === item.id ? 'chip chip-on' : 'chip'}
                        onClick={() => {
                            setFilter(item.id);
                            setOpenCollection(null);
                        }}
                    >
                        {item.label}
                        <span className="chip-count">{item.count}</span>
                    </button>
                ))}
            </div>

            {filter === 'collections' && !activeCollection ? (
                store.collections.length === 0 ? (
                    <EmptyState icon="folder_plus" title={ui.noCollectionItems} />
                ) : (
                    <div className="list-group-body">
                        {store.collections.map(collection => {
                            const count = store.collectionItems.filter(item => item.collectionId === collection.id).length;
                            return (
                                <div key={collection.id} className="list-row list-row-interactive collection-row">
                                    <button type="button" className="collection-main" onClick={() => setOpenCollection(collection.id)}>
                                        <span className="row-icon row-icon-primary" aria-hidden="true">
                                            <Icon name="folder_plus" size={17} />
                                        </span>
                                        <span className="row-copy">
                                            <span className="row-title">{collectionDisplayName(ui, collection)}</span>
                                        </span>
                                        <span className="row-value">{count}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="icon-btn icon-btn-small"
                                        aria-label={ui.more}
                                        onClick={() => {
                                            setManaging(collection);
                                            setRenameDraft(collectionDisplayName(ui, collection));
                                        }}
                                    >
                                        <Icon name="more" size={18} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : null}

            {activeCollection ? (
                <div className="collection-head">
                    <button type="button" className="back-link" onClick={() => setOpenCollection(null)}>
                        <Icon name="chevron_left" size={18} strokeWidth={2.2} />
                        {ui.collections}
                    </button>
                    <h2 className="section-title">{collectionDisplayName(ui, activeCollection)}</h2>
                </div>
            ) : null}

            {filter !== 'collections' && visibleItems.length === 0 ? (
                <EmptyState
                    icon="bookmark"
                    title={ui.noSavedYet}
                    body={ui.noSavedHint}
                    action={
                        <Link className="btn btn-tinted" to="/study">
                            {ui.startReading}
                        </Link>
                    }
                />
            ) : null}
            {activeCollection && visibleItems.length === 0 ? <EmptyState icon="folder_plus" title={ui.noCollectionItems} /> : null}

            {filter !== 'collections' || activeCollection ? (
                <ul className="saved-list">
                    {visibleItems.map(item => {
                        const {text} = describeStoredVerse(item.payload);
                        return (
                            <li key={item.id} className={item.color ? `saved-item saved-item-${item.color}` : 'saved-item'}>
                                <Link className="saved-link" to={`/reader/${item.payload.bookId}/${item.payload.chapter}`} state={{targetKey: item.payload.key}}>
                                    <span className="saved-meta">
                                        <span className="saved-kind">
                                            <Icon
                                                name={item.kind === 'note' ? 'edit_note' : item.kind === 'highlight' ? 'highlighter' : item.kind === 'collection' ? 'folder_plus' : 'bookmark'}
                                                size={13}
                                            />
                                            {item.kind === 'note' ? ui.note : item.kind === 'highlight' ? ui.highlight : item.kind === 'collection' ? ui.collection : ui.bookmark}
                                        </span>
                                        <span className="saved-ref">{reference(item.payload)}</span>
                                    </span>
                                    {item.note ? <span className="saved-note">{item.note}</span> : null}
                                    <span className={item.note ? 'saved-text saved-text-quoted' : 'saved-text'} lang="ti">
                                        {text}
                                    </span>
                                </Link>
                                <div className="saved-actions">
                                    <button type="button" className="icon-btn icon-btn-small" aria-label={ui.share} onClick={() => void share(item.payload)}>
                                        <Icon name="share" size={16} />
                                    </button>
                                    <button type="button" className="icon-btn icon-btn-small" aria-label={ui.remove} onClick={() => remove(item)}>
                                        <Icon name="trash" size={16} />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : null}

            <Sheet open={managing != null} onClose={() => setManaging(null)} title={managing ? collectionDisplayName(ui, managing) : ''} closeLabel={ui.close}>
                {managing ? (
                    <form
                        className="manage-collection"
                        onSubmit={event => {
                            event.preventDefault();
                            store.renameCollection(managing.id, renameDraft);
                            setManaging(null);
                        }}
                    >
                        <label className="field-label" htmlFor="collection-rename">
                            {ui.collectionName}
                        </label>
                        <input id="collection-rename" className="field" value={renameDraft} onChange={event => setRenameDraft(event.target.value)} />
                        <div className="button-row button-row-spread">
                            <button
                                type="button"
                                className="btn btn-plain btn-destructive"
                                onClick={() => {
                                    if (window.confirm(ui.deleteCollectionConfirm(collectionDisplayName(ui, managing)))) {
                                        store.deleteCollection(managing.id);
                                        setManaging(null);
                                        setOpenCollection(null);
                                    }
                                }}
                            >
                                <Icon name="trash" size={16} />
                                {ui.delete}
                            </button>
                            <button type="submit" className="btn btn-filled" disabled={!renameDraft.trim()}>
                                {ui.save}
                            </button>
                        </div>
                    </form>
                ) : null}
            </Sheet>
        </section>
    );
}
