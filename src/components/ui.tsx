import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';
import Icon from './Icon';

export function PageHeader({eyebrow, title, actions, children}: {eyebrow?: ReactNode; title: ReactNode; actions?: ReactNode; children?: ReactNode}) {
    return (
        <header className="page-header">
            <div className="page-header-row">
                <div className="page-header-copy">
                    {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
                    <h1 className="page-title">{title}</h1>
                </div>
                {actions ? <div className="page-actions">{actions}</div> : null}
            </div>
            {children}
        </header>
    );
}

export function SectionHeader({title, action}: {title: ReactNode; action?: ReactNode}) {
    return (
        <div className="section-head">
            <h2 className="section-title">{title}</h2>
            {action}
        </div>
    );
}

export function Switch({checked, onChange, label}: {checked: boolean; onChange: (value: boolean) => void; label: string}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            className={checked ? 'switch switch-on' : 'switch'}
            onClick={() => onChange(!checked)}
        >
            <span className="switch-thumb" />
        </button>
    );
}

export function Segmented<T extends string>({
    value,
    options,
    onChange,
    label,
    stretch = false
}: {
    value: T;
    options: Array<{value: T; label: ReactNode}>;
    onChange: (value: T) => void;
    label: string;
    stretch?: boolean;
}) {
    return (
        <div className={stretch ? 'segmented segmented-stretch' : 'segmented'} role="radiogroup" aria-label={label}>
            {options.map(option => (
                <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={value === option.value}
                    className={value === option.value ? 'segment segment-active' : 'segment'}
                    onClick={() => onChange(option.value)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

export function ListGroup({header, footer, children}: {header?: ReactNode; footer?: ReactNode; children: ReactNode}) {
    return (
        <section className="list-group">
            {header ? <h2 className="list-group-header">{header}</h2> : null}
            <div className="list-group-body">{children}</div>
            {footer ? <p className="list-group-footer">{footer}</p> : null}
        </section>
    );
}

type RowProps = {
    icon?: string;
    iconTone?: string;
    title: ReactNode;
    detail?: ReactNode;
    value?: ReactNode;
    accessory?: ReactNode;
    to?: string;
    onClick?: () => void;
    destructive?: boolean;
    chevron?: boolean;
    children?: ReactNode;
};

export function ListRow({icon, iconTone, title, detail, value, accessory, to, onClick, destructive, chevron, children}: RowProps) {
    const content = (
        <>
            {icon ? (
                <span className={`row-icon row-icon-${iconTone ?? 'primary'}`} aria-hidden="true">
                    <Icon name={icon} size={17} strokeWidth={2} />
                </span>
            ) : null}
            <span className="row-copy">
                <span className={destructive ? 'row-title row-destructive' : 'row-title'}>{title}</span>
                {detail ? <span className="row-detail">{detail}</span> : null}
            </span>
            {value != null ? <span className="row-value">{value}</span> : null}
            {accessory}
            {chevron || to ? <Icon name="chevron_right" size={17} className="row-chevron" /> : null}
        </>
    );

    if (to) {
        return (
            <Link className="list-row list-row-interactive" to={to}>
                {content}
            </Link>
        );
    }
    if (onClick) {
        return (
            <button type="button" className="list-row list-row-interactive" onClick={onClick}>
                {content}
            </button>
        );
    }
    return (
        <div className="list-row">
            {content}
            {children}
        </div>
    );
}

export function ProgressBar({value, label}: {value: number; label?: string}) {
    const clamped = Math.max(0, Math.min(100, value));
    return (
        <div
            className="progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(clamped)}
            aria-label={label}
        >
            <span className="progress-fill" style={{width: `${clamped}%`}} />
        </div>
    );
}

export function EmptyState({icon, title, body, action}: {icon: string; title: ReactNode; body?: ReactNode; action?: ReactNode}) {
    return (
        <div className="empty-state">
            <span className="empty-icon" aria-hidden="true">
                <Icon name={icon} size={26} />
            </span>
            <h2>{title}</h2>
            {body ? <p>{body}</p> : null}
            {action}
        </div>
    );
}
