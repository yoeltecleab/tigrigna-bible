import {themeTiers, themes, type DesignTheme} from '../themes';

type Props = {
    value: DesignTheme;
    onChange: (id: DesignTheme) => void;
    tierLabels?: Record<string, string>;
};

export default function ThemePicker({value, onChange, tierLabels}: Props) {
    return (
        <div className="theme-picker stack-sm" role="listbox" aria-label="Design theme">
            {themeTiers.map(({tier, label}) => {
                const group = themes.filter(t => t.tier === tier);
                if (group.length === 0) return null;
                return (
                    <div key={tier} className="theme-tier stack-xs">
                        <p className="theme-tier-label">{tierLabels?.[tier] ?? label}</p>
                        <div className="theme-swatches">
                            {group.map(t => {
                                const selected = value === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        role="option"
                                        aria-selected={selected}
                                        aria-label={`${t.label} — ${t.description}`}
                                        title={`${t.label} — ${t.description}`}
                                        className={selected ? 'theme-swatch theme-swatch-active' : 'theme-swatch'}
                                        style={{background: t.preview}}
                                        onClick={() => onChange(t.id)}
                                    >
                                        <span className="theme-swatch-name">{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
