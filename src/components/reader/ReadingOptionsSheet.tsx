import Sheet from '../Sheet';
import {ListGroup, ListRow, Segmented, Switch} from '../ui';
import {useSettingsStore} from '../../store/settingsStore';
import type {UiStrings} from '../../i18n/ui';

type Props = {
    open: boolean;
    onClose: () => void;
    ui: UiStrings;
    compareMode: boolean;
    onCompareMode: (value: boolean) => void;
    onSelectVerses: () => void;
    onOpenThemes: () => void;
};

const SIZE_STEPS = [0.85, 0.95, 1.05, 1.15, 1.3, 1.45, 1.6, 1.8];
const SPACING_STEPS = [1.5, 1.65, 1.8, 2, 2.2];

const step = (steps: number[], current: number, direction: 1 | -1) => {
    const index = steps.reduce((best, value, i) => (Math.abs(value - current) < Math.abs(steps[best] - current) ? i : best), 0);
    return steps[Math.max(0, Math.min(steps.length - 1, index + direction))];
};

export function ReadingControls({ui}: {ui: UiStrings}) {
    const settings = useSettingsStore();

    return (
        <>
            <div className="stepper-card">
                <div className="stepper">
                    <button
                        type="button"
                        className="stepper-btn"
                        aria-label={`${ui.textSize} −`}
                        onClick={() => settings.setFontScale(step(SIZE_STEPS, settings.fontScale, -1))}
                        disabled={settings.fontScale <= SIZE_STEPS[0]}
                    >
                        <span className="stepper-glyph stepper-glyph-sm">ሀ</span>
                    </button>
                    <span className="stepper-label">{ui.textSize}</span>
                    <button
                        type="button"
                        className="stepper-btn"
                        aria-label={`${ui.textSize} +`}
                        onClick={() => settings.setFontScale(step(SIZE_STEPS, settings.fontScale, 1))}
                        disabled={settings.fontScale >= SIZE_STEPS[SIZE_STEPS.length - 1]}
                    >
                        <span className="stepper-glyph stepper-glyph-lg">ሀ</span>
                    </button>
                </div>
                <div className="stepper">
                    <button
                        type="button"
                        className="stepper-btn"
                        aria-label={`${ui.spacing} −`}
                        onClick={() => settings.setLineHeightScale(step(SPACING_STEPS, settings.lineHeightScale, -1))}
                        disabled={settings.lineHeightScale <= SPACING_STEPS[0]}
                    >
                        <span className="spacing-glyph spacing-glyph-tight" aria-hidden="true" />
                    </button>
                    <span className="stepper-label">{ui.spacing}</span>
                    <button
                        type="button"
                        className="stepper-btn"
                        aria-label={`${ui.spacing} +`}
                        onClick={() => settings.setLineHeightScale(step(SPACING_STEPS, settings.lineHeightScale, 1))}
                        disabled={settings.lineHeightScale >= SPACING_STEPS[SPACING_STEPS.length - 1]}
                    >
                        <span className="spacing-glyph spacing-glyph-loose" aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div className="options-row">
                <span className="options-label">{ui.font}</span>
                <Segmented
                    value={settings.readerFont}
                    onChange={settings.setReaderFont}
                    label={ui.font}
                    options={[
                        {value: 'serif', label: <span className="font-sample-serif">{ui.fontSerif}</span>},
                        {value: 'sans', label: <span className="font-sample-sans">{ui.fontSans}</span>}
                    ]}
                />
            </div>
            <div className="options-row">
                <span className="options-label">{ui.layout}</span>
                <Segmented
                    value={settings.readerLayout}
                    onChange={settings.setReaderLayout}
                    label={ui.layout}
                    options={[
                        {value: 'verses', label: ui.layoutVerses},
                        {value: 'paragraph', label: ui.layoutParagraph}
                    ]}
                />
            </div>

            <ListGroup footer={ui.focusAutoHideHint}>
                <ListRow
                    title={ui.verseNumbers}
                    accessory={<Switch checked={settings.showVerseNumbers} onChange={settings.setShowVerseNumbers} label={ui.verseNumbers} />}
                />
                <ListRow
                    title={ui.sectionHeadings}
                    accessory={<Switch checked={settings.showHeadings} onChange={settings.setShowHeadings} label={ui.sectionHeadings} />}
                />
                <ListRow
                    title={ui.savedMarkers}
                    accessory={<Switch checked={settings.showMarkers} onChange={settings.setShowMarkers} label={ui.savedMarkers} />}
                />
                <ListRow
                    title={ui.focusAutoHide}
                    accessory={<Switch checked={settings.focusAutoHide} onChange={settings.setFocusAutoHide} label={ui.focusAutoHide} />}
                />
            </ListGroup>
        </>
    );
}

export default function ReadingOptionsSheet({open, onClose, ui, compareMode, onCompareMode, onSelectVerses, onOpenThemes}: Props) {
    return (
        <Sheet open={open} onClose={onClose} title={ui.readingOptions} closeLabel={ui.close}>
            <div className="options-stack">
                <ReadingControls ui={ui} />
                <ListGroup>
                    <ListRow
                        icon="columns"
                        title={ui.compareSideBySide}
                        accessory={<Switch checked={compareMode} onChange={onCompareMode} label={ui.compareSideBySide} />}
                    />
                    <ListRow
                        icon="select"
                        title={ui.selectVerses}
                        chevron
                        onClick={() => {
                            onClose();
                            onSelectVerses();
                        }}
                    />
                    <ListRow
                        icon="palette"
                        title={ui.theme}
                        chevron
                        onClick={() => {
                            onClose();
                            onOpenThemes();
                        }}
                    />
                </ListGroup>
            </div>
        </Sheet>
    );
}
