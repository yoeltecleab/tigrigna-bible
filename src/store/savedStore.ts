import {create} from 'zustand';
import {persist} from 'zustand/middleware';

type SavedVerse = {
    key: string;
    bookId: string;
    chapter: number;
    verse: number;
    text: string;
    createdAt: string;
    kind: 'bookmark' | 'highlight';
};

type Collection = {
    id: string;
    name: string;
    color: string;
};

type CollectionItem = {
    id: string;
    collectionId: string;
    key: string;
    bookId: string;
    chapter: number;
    verse: number;
    text: string;
    createdAt: string;
};

type VerseNote = {
    id: string;
    key: string;
    bookId: string;
    chapter: number;
    verse: number;
    text: string;
    note: string;
    createdAt: string;
    updatedAt: string;
};

type SavedState = {
    verses: SavedVerse[];
    collections: Collection[];
    collectionItems: CollectionItem[];
    notes: VerseNote[];
    toggleBookmark: (verse: Omit<SavedVerse, 'createdAt' | 'kind'>) => void;
    toggleHighlight: (verse: Omit<SavedVerse, 'createdAt' | 'kind'>) => void;
    createCollection: (name: string) => string;
    addToCollection: (collectionId: string, verse: Omit<CollectionItem, 'id' | 'collectionId' | 'createdAt'>) => void;
    removeFromCollection: (collectionId: string, key: string) => void;
    upsertNote: (note: Omit<VerseNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
    removeNote: (key: string) => void;
    getNote: (key: string) => VerseNote | undefined;
    getCollectionsForVerse: (key: string) => Collection[];
    isInCollection: (collectionId: string, key: string) => boolean;
    isBookmarked: (key: string) => boolean;
    isHighlighted: (key: string) => boolean;
};

const upsert = (verses: SavedVerse[], value: SavedVerse) => {
    const exists = verses.find(v => v.key === value.key && v.kind === value.kind);
    if (exists) {
        return verses.filter(v => !(v.key === value.key && v.kind === value.kind));
    }
    return [value, ...verses];
};

export const useSavedStore = create<SavedState>()(
    persist(
        (set, get) => ({
            verses: [],
            collections: [
                {id: 'prayer-focus', name: 'Prayer focus', color: '#5b8ddf'},
                {id: 'wisdom-pearls', name: 'Wisdom pearls', color: '#3d9f6f'}
            ],
            collectionItems: [],
            notes: [],
            toggleBookmark: verse =>
                set(state => ({
                    verses: upsert(state.verses, {
                        ...verse,
                        createdAt: new Date().toISOString(),
                        kind: 'bookmark'
                    })
                })),
            toggleHighlight: verse =>
                set(state => ({
                    verses: upsert(state.verses, {
                        ...verse,
                        createdAt: new Date().toISOString(),
                        kind: 'highlight'
                    })
                })),
            createCollection: name => {
                const trimmed = name.trim();
                if (!trimmed) {
                    return '';
                }

                const existing = get().collections.find(item => item.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase());
                if (existing) {
                    return existing.id;
                }

                const id = `collection-${trimmed.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                set(state => ({
                    collections: [
                        ...state.collections,
                        {
                            id,
                            name: trimmed,
                            color: '#7e62c8'
                        }
                    ]
                }));
                return id;
            },
            addToCollection: (collectionId, verse) =>
                set(state => {
                    const exists = state.collectionItems.some(
                        item => item.collectionId === collectionId && item.key === verse.key
                    );
                    if (exists) {
                        return state;
                    }

                    return {
                        collectionItems: [
                            {
                                ...verse,
                                id: `${collectionId}:${verse.key}`,
                                collectionId,
                                createdAt: new Date().toISOString()
                            },
                            ...state.collectionItems
                        ]
                    };
                }),
            removeFromCollection: (collectionId, key) =>
                set(state => ({
                    collectionItems: state.collectionItems.filter(item => !(item.collectionId === collectionId && item.key === key))
                })),
            upsertNote: note =>
                set(state => {
                    const trimmed = note.note.trim();
                    if (!trimmed) {
                        return {
                            notes: state.notes.filter(item => item.key !== note.key)
                        };
                    }

                    const existing = state.notes.find(item => item.key === note.key);
                    if (existing) {
                        return {
                            notes: state.notes.map(item =>
                                item.key === note.key
                                    ? {
                                        ...item,
                                        note: trimmed,
                                        updatedAt: new Date().toISOString()
                                    }
                                    : item
                            )
                        };
                    }

                    return {
                        notes: [
                            {
                                ...note,
                                id: `note:${note.key}`,
                                note: trimmed,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            },
                            ...state.notes
                        ]
                    };
                }),
            removeNote: key =>
                set(state => ({
                    notes: state.notes.filter(item => item.key !== key)
                })),
            getNote: key => get().notes.find(item => item.key === key),
            getCollectionsForVerse: key => {
                const state = get();
                const collectionIds = new Set(
                    state.collectionItems.filter(item => item.key === key).map(item => item.collectionId)
                );
                return state.collections.filter(collection => collectionIds.has(collection.id));
            },
            isInCollection: (collectionId, key) =>
                get().collectionItems.some(item => item.collectionId === collectionId && item.key === key),
            isBookmarked: key => get().verses.some(v => v.key === key && v.kind === 'bookmark'),
            isHighlighted: key => get().verses.some(v => v.key === key && v.kind === 'highlight')
        }),
        {name: 'tb-web-saved-v1'}
    )
);
