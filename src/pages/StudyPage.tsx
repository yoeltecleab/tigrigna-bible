import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadBooks } from '../data/api';
import { useSettingsStore } from '../store/settingsStore';

export default function StudyPage() {
  const language = useSettingsStore(state => state.language);
  const lastReading = useSettingsStore(state => state.lastReading);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    if (lastReading) {
      navigate(`/reader/${lastReading.bookId}/${lastReading.chapter}`, { replace: true });
      return;
    }

    void loadBooks(language).then(books => {
      if (cancelled) {
        return;
      }

      const firstBook = books[0];
      if (firstBook) {
        navigate(`/reader/${firstBook.id}/1`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [language, lastReading, navigate]);

  return (
    <section className="stack-lg">
      <div className="panel hero-panel">
        <p className="eyebrow">Study</p>
        <h2>Opening your last reading position.</h2>
        <p className="muted">Preparing the reader experience.</p>
      </div>
    </section>
  );
}
