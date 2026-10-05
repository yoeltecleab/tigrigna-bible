import {ReactNode} from 'react';

type VerseCardProps = {
    verse: string;
    meta: string;
    actions?: ReactNode;
};

export default function VerseCard({verse, meta, actions}: VerseCardProps) {
    return (
        <article className="verse-card">
            <p className="verse-text">{verse}</p>
            <footer className="verse-footer">
                <span>{meta}</span>
                {actions}
            </footer>
        </article>
    );
}
