import {create} from 'zustand';
import {persist} from 'zustand/middleware';

export type HighlightColor = 'gold' | 'rose' | 'green' | 'sky';

export const HIGHLIGHT_COLORS: HighlightColor[] = ['gold', 'rose', 'green', 'sky'];

type SavedVerse = {
    key: string;
    bookId: string;
    chapter: number;
    verse: number;
    text: string;
    createdAt: string;
    kind: 'bookmark' | 'highlight';
    color?: HighlightColor;
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

type VersePayload = Omit<SavedVerse, 'createdAt' | 'kind' | 'color'>;

type SavedState = {
    verses: SavedVerse[];
    collections: Collection[];
    collectionItems: CollectionItem[];
    notes: VerseNote[];
    toggleBookmark: (verse: VersePayload) => void;
    toggleHighlight: (verse: VersePayload, color?: HighlightColor) => void;
    setHighlightColor: (verse: VersePayload, color: HighlightColor) => void;
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
    getHighlightColor: (key: string) => HighlightColor | null;
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
                set(state => {
                    const exists = state.verses.some(item => item.key === verse.key && item.kind === 'bookmark');
                    if (exists) {
                        return {
                            verses: state.verses.filter(item => !(item.key === verse.key && item.kind === 'bookmark'))
                        };
                    }
                    return {
                        verses: [
                            {
                                ...verse,
                                createdAt: new Date().toISOString(),
                                kind: 'bookmark'
                            },
                            ...state.verses
                        ]
                    };
                }),
            toggleHighlight: (verse, color = 'gold') =>
                set(state => {
                    const existing = state.verses.find(item => item.key === verse.key && item.kind === 'highlight');
                    if (existing && (existing.color ?? 'gold') === color) {
                        return {
                            verses: state.verses.filter(item => !(item.key === verse.key && item.kind === 'highlight'))
                        };
                    }
                    if (existing) {
                        return {
                            verses: state.verses.map(item =>
                                item.key === verse.key && item.kind === 'highlight'
                                    ? {...item, color, text: verse.text}
                                    : item
                            )
                        };
                    }
                    return {
                        verses: [
                            {
                                ...verse,
                                createdAt: new Date().toISOString(),
                                kind: 'highlight',
                                color
                            },
                            ...state.verses
                        ]
                    };
                }),
            setHighlightColor: (verse, color) =>
                set(state => {
                    const existing = state.verses.find(item => item.key === verse.key && item.kind === 'highlight');
                    if (existing) {
                        return {
                            verses: state.verses.map(item =>
                                item.key === verse.key && item.kind === 'highlight' ? {...item, color} : item
                            )
                        };
                    }
                    return {
                        verses: [
                            {
                                ...verse,
                                createdAt: new Date().toISOString(),
                                kind: 'highlight',
                                color
                            },
                            ...state.verses
                        ]
                    };
                }),
            createCollection: name => {
                const trimmed = name.trim();
                if (!trimmed) {
                    return '';
                }

                const existing = get().collections.find(item => item.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase());
                if (existing) {
                    return existing.id;
                }

                const slug = trimmed
                    .toLocaleLowerCase()
                    .normalize('NFKC')
                    .replace(/[^\p{L}\p{N}]+/gu, '-')
                    .replace(/^-+|-+$/g, '')
                    .slice(0, 48);
                const id = `collection-${slug || Date.now().toString(36)}`;
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
            isHighlighted: key => get().verses.some(v => v.key === key && v.kind === 'highlight'),
            getHighlightColor: key => {
                const item = get().verses.find(v => v.key === key && v.kind === 'highlight');
                return item ? (item.color ?? 'gold') : null;
            }
        }),
        {name: 'tb-web-saved-v1'}
    )
);
