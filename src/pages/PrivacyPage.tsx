import {Link} from 'react-router-dom';
import {getUi} from '../i18n/ui';
import {useSettingsStore} from '../store/settingsStore';
import Icon from '../components/Icon';

export default function PrivacyPage() {
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);
    const isTi = systemLanguage === 'ti';

    const sections = isTi
        ? [
              {title: 'ሕሳብ የለን', body: 'እዚ መተግበሪ ሕሳብ ኣይሓትትን። ናይ ንባብ ሓበሬታኻ ኣብ መሳርሒኻ ጥራይ ይጸንሕ።'},
              {title: 'እንታይ ይዕቀብ', body: 'ቅንብራት፡ ምልክታት፡ ሕብርታት፡ መዘኻኸሪታት፡ እኩባት፡ ምዕባለ ንባብን ናይ ቀረባ ድለያታትን ኣብ localStorage ናይ መርበብካ ይዕቀቡ።'},
              {title: 'ብዘይ መርበብ', body: 'ዝወረዱ ምዕራፋትን መወከሲ ድለያን ኣብ Cache API ናይ መሳርሒኻ ይዕቀቡ።'},
              {title: 'ትንታነ', body: 'Vercel Analytics ከምኡ’ውን Speed Insights ስም ዘይብሉ ናይ ኣጠቓቕማን ቅልጣፈን ሓበሬታ ክእክቡ ይኽእሉ።'}
          ]
        : [
              {title: 'No account', body: 'The app never asks you to sign in. Your reading data stays on your device.'},
              {
                  title: 'What is stored',
                  body: 'Settings, bookmarks, highlights, notes, collections, reading progress and recent searches are stored in your browser’s localStorage.'
              },
              {title: 'Offline content', body: 'Downloaded chapters and the search index are stored in the Cache API on your device.'},
              {title: 'Analytics', body: 'Vercel Analytics and Speed Insights may collect anonymous usage and performance metrics.'}
          ];

    return (
        <section className="page prose-page">
            <Link className="back-link" to="/settings">
                <Icon name="chevron_left" size={18} strokeWidth={2.2} />
                {ui.settings}
            </Link>
            <h1 className="page-title">{ui.privacyPolicy}</h1>
            {sections.map(section => (
                <div key={section.title} className="card prose-card">
                    <h2 className="card-title">{section.title}</h2>
                    <p>{section.body}</p>
                </div>
            ))}
        </section>
    );
}
