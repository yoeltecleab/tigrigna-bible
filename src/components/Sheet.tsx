import {useEffect, useId, useRef, useState, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import Icon from './Icon';

type Props = {
    open: boolean;
    onClose: () => void;
    title: ReactNode;
    subtitle?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    headerAction?: ReactNode;
    size?: 'auto' | 'tall';
    closeLabel?: string;
};

const EXIT_MS = 220;
let openSheets = 0;

export default function Sheet({open, onClose, title, subtitle, children, footer, headerAction, size = 'auto', closeLabel = 'Close'}: Props) {
    const [mounted, setMounted] = useState(open);
    const [closing, setClosing] = useState(false);
    const [dragY, setDragY] = useState(0);
    const panelRef = useRef<HTMLDivElement>(null);
    const dragStart = useRef<number | null>(null);
    const onCloseRef = useRef(onClose);
    const titleId = useId();
    onCloseRef.current = onClose;

    useEffect(() => {
        if (open) {
            setMounted(true);
            setClosing(false);
            setDragY(0);
            return;
        }
        if (!mounted) return;
        setClosing(true);
        const timer = window.setTimeout(() => {
            setMounted(false);
            setClosing(false);
        }, EXIT_MS);
        return () => window.clearTimeout(timer);
    }, [open, mounted]);

    useEffect(() => {
        if (!open) return;
        const previouslyFocused = document.activeElement as HTMLElement | null;
        openSheets += 1;
        document.documentElement.classList.add('sheet-open');
        const frame = requestAnimationFrame(() => {
            const target = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panelRef.current;
            target?.focus({preventScroll: true});
        });
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                onCloseRef.current();
            }
            if (event.key === 'Tab' && panelRef.current) {
                const focusables = panelRef.current.querySelectorAll<HTMLElement>(
                    'button:not(:disabled), [href], input:not(:disabled), textarea, select, [tabindex]:not([tabindex="-1"])'
                );
                if (focusables.length === 0) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('keydown', onKey);
            openSheets = Math.max(0, openSheets - 1);
            if (openSheets === 0) document.documentElement.classList.remove('sheet-open');
            previouslyFocused?.focus?.({preventScroll: true});
        };
    }, [open]);

    if (!mounted) return null;

    const onPointerDown = (event: React.PointerEvent) => {
        dragStart.current = event.clientY;
        (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event: React.PointerEvent) => {
        if (dragStart.current == null) return;
        setDragY(Math.max(0, event.clientY - dragStart.current));
    };
    const onPointerUp = () => {
        if (dragStart.current == null) return;
        dragStart.current = null;
        if (dragY > 90) {
            onClose();
        } else {
            setDragY(0);
        }
    };

    return createPortal(
        <div className={closing ? 'sheet-root sheet-closing' : 'sheet-root'}>
            <div className="sheet-scrim" onClick={onClose} aria-hidden="true" />
            <div
                ref={panelRef}
                className={size === 'tall' ? 'sheet-panel sheet-tall' : 'sheet-panel'}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                style={dragY > 0 ? {transform: `translateY(${dragY}px)`, transition: 'none'} : undefined}
            >
                <div
                    className="sheet-grabber"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    aria-hidden="true"
                >
                    <span />
                </div>
                <header
                    className="sheet-head"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                >
                    <div className="sheet-head-copy">
                        <h2 id={titleId} className="sheet-title">{title}</h2>
                        {subtitle ? <p className="sheet-subtitle">{subtitle}</p> : null}
                    </div>
                    {headerAction}
                    <button
                        type="button"
                        className="sheet-close"
                        aria-label={closeLabel}
                        onPointerDown={event => event.stopPropagation()}
                        onClick={onClose}
                    >
                        <Icon name="close" size={16} strokeWidth={2.5} />
                    </button>
                </header>
                <div className="sheet-body">{children}</div>
                {footer ? <footer className="sheet-footer">{footer}</footer> : null}
            </div>
        </div>,
        document.body
    );
}
