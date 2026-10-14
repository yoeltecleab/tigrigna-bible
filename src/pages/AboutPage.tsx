import {getUi} from '../i18n/ui';
import {useSettingsStore} from '../store/settingsStore';

export default function AboutPage() {
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);
    const isTi = systemLanguage === 'ti';

    return (
        <section className="stack-lg legal-page">
            <div className="panel hero-panel stack-sm">
                <p className="eyebrow">{ui.about}</p>
                <h2>ወንጌል ቅዱስ · Tigrigna Bible</h2>
                <p className="muted">
                    {isTi
                        ? 'ብዘይ መርበብ ዝሰርሕ ንባብ፣ ድለያ፣ መልክዕን መዘኻኸርን ዘለዎ Progressive Web App።'
                        : 'An offline-capable Progressive Web App for reading, searching, bookmarking, and sharing the Bible in Tigrigna.'}
                </p>
            </div>

            <div className="panel stack-sm">
                <h3>{isTi ? 'ባህርያት' : 'Features'}</h3>
                <ul className="legal-list">
                    <li>{ui.library} — Old & New Testament (73 books)</li>
                    <li>{ui.search} — {ui.exactPhrase}, {ui.oldTestament}/{ui.newTestament} filters</li>
                    <li>{ui.savedVerses} — {ui.bookmark}, {ui.highlight}, {ui.note}, {ui.collection}</li>
                    <li>{ui.offlinePack} — {ui.downloadOffline}</li>
                    <li>{ui.installApp}</li>
                </ul>
            </div>

            <div className="panel stack-sm">
                <h3>{ui.aboutAttribution}</h3>
                <p>
                    {isTi
                        ? 'ጽሑፍ ትግርኛ ንውልቃዊ ትምህርትን ጸሎትን ተዳልዩ እዩ። እንተ መሰል ትርጉም ኣለካ፣ ንምርግጋጽ ወይ ንምእራም ኣድራሻ ስንድኦ።'
                        : 'The Tigrigna scripture text bundled in this app is provided for personal study and devotion. Rights holders may contact the maintainer for attribution corrections or removal.'}
                </p>
                <p className="muted">
                    {isTi ? 'ምንጭ ትርጉም፦ ' : 'Translation source: '}
                    <strong>Tigrigna Bible digital corpus — rights pending confirmation</strong>
                </p>
                <p>
                    © {new Date().getFullYear()} Tigrigna Bible · UI & software. Scripture remains with its copyright holders.
                </p>
            </div>
        </section>
    );
}
