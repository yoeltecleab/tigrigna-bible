import {Link} from 'react-router-dom';
import {getUi} from '../i18n/ui';
import {useSettingsStore} from '../store/settingsStore';

export default function PrivacyPage() {
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);
    const isTi = systemLanguage === 'ti';

    return (
        <section className="stack-lg legal-page">
            <div className="panel hero-panel stack-sm">
                <p className="eyebrow">{ui.privacy}</p>
                <h2>{ui.privacyPolicy}</h2>
                <p className="muted">
                    {isTi
                        ? 'እዚ መተግበሪ ሕሳብ ኣይሓትትን፣ ውሽጣዊ መረዳእታ ኣብ መሳርሒኻ ይቕመጥ።'
                        : 'This app does not require accounts. Personal reading data stays on your device.'}
                </p>
            </div>

            <div className="panel stack-sm">
                <h3>{isTi ? 'እንታይ ንቕምጥ' : 'What we store'}</h3>
                <p>
                    {isTi
                        ? 'ቅንብራት ንባብ፣ መልክዕ፣ ብርሃን፣ መዘኻኸሪ፣ እከባታትን ናይ ቀረባ ድለያታትን ኣብ localStorage ይቕመጡ።'
                        : 'Reading preferences, bookmarks, highlights, notes, collections, and recent searches are stored locally in your browser (localStorage).'}
                </p>
                <p>
                    {isTi
                        ? 'ንብዘይ መርበብ ዝተወረደ ምዕራፋት ኣብ Cache API ይቕመጡ።'
                        : 'Downloaded offline chapters and search shards are stored in the Cache API on your device.'}
                </p>
            </div>

            <div className="panel stack-sm">
                <h3>{isTi ? 'ትንታነ' : 'Analytics'}</h3>
                <p>
                    {isTi
                        ? 'Vercel Analytics ከምኡ’ውን Speed Insights ንናይ ኣገልግሎት ጥራይ ይጥቀሙ።'
                        : 'Vercel Analytics and Speed Insights may collect anonymous usage and performance metrics.'}
                </p>
            </div>

            <div className="panel stack-sm">
                <p className="muted">
                    {isTi ? 'ተወሳኺ' : 'See also'}{' '}
                    <Link className="inline-link" to="/about">
                        {ui.about}
                    </Link>
                    .
                </p>
            </div>
        </section>
    );
}
