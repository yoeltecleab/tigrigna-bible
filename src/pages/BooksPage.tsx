import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { loadBooks } from '../data/api';
import { Book } from '../types/bible';
import { useSettingsStore } from '../store/settingsStore';

export default function BooksPage() {
  const { bookId = '' } = useParams();
  const language = useSettingsStore(state => state.language);
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    void loadBooks(language).then(setBooks);
  }, [language]);

  const book = useMemo(() => books.find(item => item.id === bookId) ?? null, [books, bookId]);

  if (!book) {
    return (
      <section className="stack-lg">
        <div className="panel">
          <h2>Book not found</h2>
          <p>The selected book is unavailable.</p>
          <Link className="btn" to="/">
            Back to library
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="stack-lg">
      <div className="panel hero-panel">
        <p className="eyebrow">Bible library</p>
        <h2>{book.title}</h2>
        <p className="muted">{book.chaptersNum} chapters • {book.testament === 'old' ? 'Old Testament' : 'New Testament'}</p>
        <div className="row gap-sm wrap">
          <Link className="btn" to="/">
            Back to books
          </Link>
          <Link className="btn btn-primary" to={`/reader/${book.id}/1`}>
            Start reading
          </Link>
        </div>
      </div>

      <div className="panel stack-sm">
        <div className="section-header">
          <div>
            <h3>Chapters</h3>
            <p className="muted">Choose a chapter to open the reader.</p>
          </div>
        </div>

        <div className="chapter-grid">
          {Array.from({ length: book.chaptersNum }, (_, index) => index + 1).map(chapter => (
            <Link key={chapter} className="chapter-pill" to={`/reader/${book.id}/${chapter}`}>
              {chapter}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
