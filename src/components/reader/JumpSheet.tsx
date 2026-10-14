import {useEffect, useMemo, useRef, useState} from 'react';
import Sheet from '../Sheet';
import Icon from '../Icon';
import {Segmented} from '../ui';
import type {Book} from '../../types/bible';
import type {UiStrings} from '../../i18n/ui';
import {chapterKey} from '../../store/progressStore';

type Props = {
    open: boolean;
    onClose: () => void;
    books: Book[];
    currentBookId: string;
    currentChapter: number;
    readChapters: Record<string, string>;
    onSelect: (bookId: string, chapter: number) => void;
    ui: UiStrings;
    showEnglish: boolean;
};

export default function JumpSheet({open, onClose, books, currentBookId, currentChapter, readChapters, onSelect, ui, showEnglish}: Props) {
    const currentBook = books.find(book => book.id === currentBookId);
    const [testament, setTestament] = useState<'old' | 'new'>(currentBook?.testament ?? 'old');
    const [expanded, setExpanded] = useState<string | null>(currentBookId);
    const [query, setQuery] = useState('');
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        setTestament(currentBook?.testament ?? 'old');
        setExpanded(currentBookId);
        setQuery('');
        const frame = window.setTimeout(() => {
            listRef.current
                ?.querySelector<HTMLElement>(`[data-book='${currentBookId}']`)
                ?.scrollIntoView({block: 'start'});
        }, 60);
        return () => window.clearTimeout(frame);
    }, [open, currentBookId, currentBook?.testament]);

    const visible = useMemo(() => {
        const needle = query.trim().toLocaleLowerCase();
        if (needle) {
            return books.filter(
                book => book.title.toLocaleLowerCase().includes(needle) || book.engname.toLocaleLowerCase().includes(needle)
            );
        }
        return books.filter(book => book.testament === testament);
    }, [books, testament, query]);

    const choose = (bookId: string, chapter: number) => {
        onSelect(bookId, chapter);
        onClose();
    };

    return (
        <Sheet open={open} onClose={onClose} title={ui.jumpTo} size="tall" closeLabel={ui.close}>
            <div className="jump-controls">
                <label className="search-field search-field-compact">
                    <Icon name="search" size={16} />
                    <input
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        placeholder={ui.filterBooks}
                        aria-label={ui.filterBooks}
                        enterKeyHint="search"
                    />
                </label>
                {!query ? (
                    <Segmented
                        value={testament}
                        onChange={setTestament}
                        label={ui.books}
                        stretch
                        options={[
                            {value: 'old', label: ui.oldTestament},
                            {value: 'new', label: ui.newTestament}
                        ]}
                    />
                ) : null}
            </div>
            <div className="jump-list" ref={listRef}>
                {visible.map(book => {
                    const isOpen = expanded === book.id;
                    const readCount = Array.from({length: book.chaptersNum}, (_, index) => index + 1).filter(
                        chapter => readChapters[chapterKey(book.id, chapter)]
                    ).length;
                    return (
                        <div key={book.id} className={isOpen ? 'jump-book jump-book-open' : 'jump-book'} data-book={book.id}>
                            <button
                                type="button"
                                className="jump-book-row"
                                aria-expanded={isOpen}
                                onClick={() => (book.chaptersNum === 1 ? choose(book.id, 1) : setExpanded(isOpen ? null : book.id))}
                            >
                                <span className="jump-book-copy">
                                    <span className="jump-book-title">{book.title}</span>
                                    {showEnglish ? <span className="jump-book-sub">{book.engname}</span> : null}
                                </span>
                                <span className="jump-book-meta">
                                    {readCount > 0 ? `${readCount}/${book.chaptersNum}` : book.chaptersNum}
                                </span>
                                <Icon name={isOpen ? 'expand_less' : 'expand_more'} size={16} className="jump-book-chevron" />
                            </button>
                            {isOpen ? (
                                <div className="chapter-grid chapter-grid-compact">
                                    {Array.from({length: book.chaptersNum}, (_, index) => index + 1).map(chapter => {
                                        const isCurrent = book.id === currentBookId && chapter === currentChapter;
                                        const isRead = Boolean(readChapters[chapterKey(book.id, chapter)]);
                                        return (
                                            <button
                                                key={chapter}
                                                type="button"
                                                className={[
                                                    'chapter-cell',
                                                    isRead ? 'chapter-cell-read' : '',
                                                    isCurrent ? 'chapter-cell-current' : ''
                                                ].join(' ')}
                                                aria-current={isCurrent ? 'page' : undefined}
                                                onClick={() => choose(book.id, chapter)}
                                            >
                                                {chapter}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </Sheet>
    );
}
