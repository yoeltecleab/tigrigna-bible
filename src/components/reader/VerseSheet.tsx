import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import Sheet from '../Sheet';
import Icon from '../Icon';
import {HIGHLIGHT_COLORS, useSavedStore, type VersePayload} from '../../store/savedStore';
import {colorLabel, collectionDisplayName, type UiStrings} from '../../i18n/ui';
import {getRelatedVerses, loadBookShard, loadReaderIndex, mergeRelatedVerses} from '../../data/api';
import type {Book, SearchVerse} from '../../types/bible';
import {copyText, formatCitation, readerShareUrl, sharePassage} from '../../lib/site';
import {toast} from '../../store/uiStore';

export type ReaderVerse = {
    key: string;
    row: number;
    start: number;
    end: number;
    label: string;
    text: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    verse: ReaderVerse | null;
    bookId: string;
    chapter: number;
    bookTitle: string;
    books: Book[];
    language: string;
    ui: UiStrings;
    onStartSelect: (key: string) => void;
};

export default function VerseSheet({open, onClose, verse, bookId, chapter, bookTitle, books, language, ui, onStartSelect}: Props) {
    const verses = useSavedStore(state => state.verses);
    const notes = useSavedStore(state => state.notes);
    const collections = useSavedStore(state => state.collections);
    const collectionItems = useSavedStore(state => state.collectionItems);
    const setBookmarked = useSavedStore(state => state.setBookmarked);
    const toggleHighlight = useSavedStore(state => state.toggleHighlight);
    const removeHighlight = useSavedStore(state => state.removeHighlight);
    const upsertNote = useSavedStore(state => state.upsertNote);
    const removeNote = useSavedStore(state => state.removeNote);
    const addToCollection = useSavedStore(state => state.addToCollection);
    const removeFromCollection = useSavedStore(state => state.removeFromCollection);
    const createCollection = useSavedStore(state => state.createCollection);

    const [noteOpen, setNoteOpen] = useState(false);
    const [noteDraft, setNoteDraft] = useState('');
    const [newCollection, setNewCollection] = useState<string | null>(null);
    const [related, setRelated] = useState<SearchVerse[] | null>(null);
    const [relatedLoading, setRelatedLoading] = useState(false);

    const key = verse?.key ?? '';
    const existingNote = notes.find(item => item.key === key) ?? null;
    const isBookmarked = verses.some(item => item.key === key && item.kind === 'bookmark');
    const highlightColor = verses.find(item => item.key === key && item.kind === 'highlight')?.color ?? null;
    const memberOf = useMemo(() => new Set(collectionItems.filter(item => item.key === key).map(item => item.collectionId)), [collectionItems, key]);
    const titles = useMemo(() => new Map(books.map(book => [book.id, book.title])), [books]);

    useEffect(() => {
        if (!open) return;
        setNoteDraft(existingNote?.note ?? '');
        setNoteOpen(Boolean(existingNote));
        setNewCollection(null);
        setRelated(null);
        setRelatedLoading(false);
        // Reset only when a different verse opens, not on every note edit.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, key]);

    if (!verse) {
        return null;
    }

    const reference = `${bookTitle} ${chapter}:${verse.label}`;
    const payload: VersePayload = {key: verse.key, bookId, chapter, verse: verse.start, label: verse.label, text: verse.text};
    const shareUrl = readerShareUrl(bookId, chapter, verse.start);

    const onCopy = async () => {
        if (await copyText(`${formatCitation(reference, verse.text)}\n${shareUrl}`)) {
            toast(ui.copied);
        }
    };

    const onShare = async () => {
        const outcome = await sharePassage(reference, verse.text, shareUrl);
        if (outcome === 'copied') toast(ui.copied);
    };

    const onBookmark = () => {
        setBookmarked(payload, !isBookmarked);
        toast(isBookmarked ? ui.bookmarkRemoved : ui.bookmarkAdded);
    };

    const onSaveNote = () => {
        if (!noteDraft.trim()) {
            if (existingNote) {
                removeNote(key);
                toast(ui.noteRemoved);
            }
            setNoteOpen(false);
            return;
        }
        upsertNote({...payload, note: noteDraft});
        toast(ui.noteSaved);
    };

    const onToggleCollection = (collectionId: string, name: string) => {
        if (memberOf.has(collectionId)) {
            removeFromCollection(collectionId, key);
            toast(ui.removedFrom(name));
        } else {
            addToCollection(collectionId, payload);
            toast(ui.addedTo(name));
        }
    };

    const onCreateCollection = () => {
        const name = newCollection?.trim();
        if (!name) {
            setNewCollection(null);
            return;
        }
        const id = createCollection(name);
        if (id) {
            addToCollection(id, payload);
            toast(ui.addedTo(name));
        }
        setNewCollection(null);
    };

    const onFindRelated = async () => {
        setRelatedLoading(true);
        const [index, shard] = await Promise.all([loadReaderIndex(language), loadBookShard(language, bookId)]);
        const source = {bookId, chapter, verse: verse.row, text: verse.text};
        const sourceKey = verse.key;
        const corpus = [...shard.filter(item => item.chapter !== chapter), ...index];
        const primary = getRelatedVerses(source, corpus, 10).filter(item => item.key !== sourceKey);
        setRelated(mergeRelatedVerses(primary, [], sourceKey, 8));
        setRelatedLoading(false);
    };

    return (
        <Sheet open={open} onClose={onClose} title={reference} closeLabel={ui.close}>
            <div className="verse-sheet">
                <blockquote className={highlightColor ? `verse-quote verse-quote-${highlightColor}` : 'verse-quote'}>{verse.text}</blockquote>

                <div className="action-row" role="group" aria-label={ui.verseActions}>
                    <button type="button" className="action-btn" onClick={() => void onCopy()}>
                        <span className="action-icon"><Icon name="copy" size={20} /></span>
                        <span>{ui.copy}</span>
                    </button>
                    <button type="button" className="action-btn" onClick={() => void onShare()}>
                        <span className="action-icon"><Icon name="share" size={20} /></span>
                        <span>{ui.share}</span>
                    </button>
                    <button type="button" className={isBookmarked ? 'action-btn action-btn-on' : 'action-btn'} aria-pressed={isBookmarked} onClick={onBookmark}>
                        <span className="action-icon">
                            <Icon name="bookmark" size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
                        </span>
                        <span>{isBookmarked ? ui.bookmarked : ui.bookmark}</span>
                    </button>
                    <button
                        type="button"
                        className={existingNote ? 'action-btn action-btn-on' : 'action-btn'}
                        aria-expanded={noteOpen}
                        onClick={() => setNoteOpen(value => !value)}
                    >
                        <span className="action-icon"><Icon name="edit_note" size={20} /></span>
                        <span>{ui.note}</span>
                    </button>
                    <button
                        type="button"
                        className="action-btn"
                        onClick={() => {
                            onClose();
                            onStartSelect(verse.key);
                        }}
                    >
                        <span className="action-icon"><Icon name="select" size={20} /></span>
                        <span>{ui.selectVerses}</span>
                    </button>
                </div>

                <div className="sheet-section">
                    <h3 className="sheet-section-title">{ui.highlight}</h3>
                    <div className="swatch-row" role="radiogroup" aria-label={ui.highlight}>
                        {HIGHLIGHT_COLORS.map(color => (
                            <button
                                key={color}
                                type="button"
                                role="radio"
                                aria-checked={highlightColor === color}
                                aria-label={colorLabel(ui, color)}
                                className={`swatch swatch-${color}${highlightColor === color ? ' swatch-on' : ''}`}
                                onClick={() => {
                                    if (highlightColor === color) {
                                        removeHighlight(key);
                                    } else {
                                        toggleHighlight(payload, color);
                                    }
                                }}
                            >
                                {highlightColor === color ? <Icon name="check" size={14} strokeWidth={3} /> : null}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="swatch swatch-none"
                            aria-label={ui.removeHighlight}
                            disabled={!highlightColor}
                            onClick={() => removeHighlight(key)}
                        >
                            <Icon name="close" size={14} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {noteOpen ? (
                    <div className="sheet-section">
                        <h3 className="sheet-section-title">{existingNote ? ui.editNote : ui.addNote}</h3>
                        <textarea
                            className="field field-textarea"
                            rows={4}
                            value={noteDraft}
                            onChange={event => setNoteDraft(event.target.value)}
                            placeholder={ui.notePlaceholder}
                            aria-label={ui.note}
                            autoFocus={!existingNote}
                        />
                        <div className="button-row">
                            {existingNote ? (
                                <button
                                    type="button"
                                    className="btn btn-plain btn-destructive"
                                    onClick={() => {
                                        removeNote(key);
                                        setNoteDraft('');
                                        setNoteOpen(false);
                                        toast(ui.noteRemoved);
                                    }}
                                >
                                    {ui.remove}
                                </button>
                            ) : null}
                            <button type="button" className="btn btn-filled" onClick={onSaveNote} disabled={noteDraft.trim() === (existingNote?.note ?? '')}>
                                {ui.save}
                            </button>
                        </div>
                    </div>
                ) : null}

                <div className="sheet-section">
                    <h3 className="sheet-section-title">{ui.collections}</h3>
                    <div className="chip-wrap">
                        {collections.map(collection => {
                            const name = collectionDisplayName(ui, collection);
                            const active = memberOf.has(collection.id);
                            return (
                                <button
                                    key={collection.id}
                                    type="button"
                                    className={active ? 'chip chip-on' : 'chip'}
                                    aria-pressed={active}
                                    onClick={() => onToggleCollection(collection.id, name)}
                                >
                                    {active ? <Icon name="check" size={14} strokeWidth={2.5} /> : null}
                                    {name}
                                </button>
                            );
                        })}
                        {newCollection == null ? (
                            <button type="button" className="chip chip-dashed" onClick={() => setNewCollection('')}>
                                <Icon name="plus" size={14} strokeWidth={2.5} />
                                {ui.newCollection}
                            </button>
                        ) : (
                            <form
                                className="inline-form"
                                onSubmit={event => {
                                    event.preventDefault();
                                    onCreateCollection();
                                }}
                            >
                                <input
                                    className="field field-inline"
                                    value={newCollection}
                                    onChange={event => setNewCollection(event.target.value)}
                                    placeholder={ui.collectionName}
                                    aria-label={ui.collectionName}
                                    autoFocus
                                    enterKeyHint="done"
                                />
                                <button type="submit" className="btn btn-filled btn-small">
                                    {ui.add}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="sheet-section">
                    {related == null ? (
                        <button type="button" className="btn btn-tinted btn-block" onClick={() => void onFindRelated()} disabled={relatedLoading}>
                            <Icon name="sparkles" size={16} />
                            {relatedLoading ? ui.loading : ui.findRelated}
                        </button>
                    ) : (
                        <>
                            <h3 className="sheet-section-title">{ui.relatedVerses}</h3>
                            {related.length === 0 ? <p className="muted-text">{ui.noRelated}</p> : null}
                            <div className="related-list">
                                {related.map(item => (
                                    <Link
                                        key={item.key}
                                        className="related-row"
                                        to={`/reader/${item.bookId}/${item.chapter}`}
                                        state={{targetKey: item.key}}
                                        onClick={onClose}
                                    >
                                        <span className="related-ref">
                                            {titles.get(item.bookId) ?? item.bookId} {item.chapter}:{item.label ?? item.verse}
                                        </span>
                                        <span className="related-text">{item.text}</span>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Sheet>
    );
}
