import {Link} from 'react-router-dom';
import {getUi} from '../i18n/ui';
import {useSettingsStore} from '../store/settingsStore';
import Icon from '../components/Icon';

export default function AboutPage() {
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);
    const isTi = systemLanguage === 'ti';

    return (
        <section className="page prose-page">
            <Link className="back-link" to="/settings">
                <Icon name="chevron_left" size={18} strokeWidth={2.2} />
                {ui.settings}
            </Link>
            <header className="about-hero">
                <img src="/icons/apple-touch-icon-v6.png" alt="" width={84} height={84} className="about-icon" />
                <h1 className="page-title">ወንጌል ቅዱስ</h1>
                <p className="muted-text">Tigrigna Bible · {ui.version} {__APP_VERSION__}</p>
            </header>

            <div className="card prose-card">
                <p>
                    {isTi
                        ? 'ብዘይ መርበብ ዝሰርሕ መጽሓፍ ቅዱስ ብትግርኛ፡ ንምንባብ፡ ንምድላይ፡ ንምምልካትን ንምክፋልን።'
                        : 'An offline-capable Bible in Tigrigna for reading, searching, highlighting and sharing Scripture.'}
                </p>
                <ul className="prose-list">
                    <li>{isTi ? '73 መጻሕፍቲ ብሉይን ሓድሽን ኪዳን' : '73 books of the Old and New Testament'}</li>
                    <li>{isTi ? 'ቅልጡፍ ድለያ ብዘይ መርበብ ውን' : 'Fast search that also works offline'}</li>
                    <li>{isTi ? 'ምልክታት፡ ሕብርታት፡ መዘኻኸሪታትን እኩባትን' : 'Bookmarks, highlights, notes and collections'}</li>
                    <li>{isTi ? 'መደባት ንባብን ተኸታታሊ መዓልትታትን' : 'Reading plans and daily streaks'}</li>
                </ul>
            </div>

            <div className="card prose-card">
                <h2 className="card-title">{ui.aboutAttribution}</h2>
                <p>
                    {isTi
                        ? 'ጽሑፍ ትግርኛ ንውልቃዊ ትምህርትን ጸሎትን ተዳልዩ እዩ። ዋናታት መሰል ንምእራም ወይ ንምልጋስ ክራኸቡ ይኽእሉ።'
                        : 'The Tigrigna scripture text is provided for personal study and devotion. Rights holders may contact the maintainer for attribution corrections or removal.'}
                </p>
                <p className="muted-text">
                    © {new Date().getFullYear()} Tigrigna Bible. {isTi ? 'መሰል ጽሑፍ ናይ ዋናታቱ እዩ።' : 'Scripture remains with its copyright holders.'}
                </p>
            </div>
        </section>
    );
}
