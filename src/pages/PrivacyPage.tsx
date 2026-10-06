import {Link} from 'react-router-dom';

export default function PrivacyPage() {
    return (
        <section className="stack-lg legal-page">
            <div className="panel hero-panel stack-sm">
                <p className="eyebrow">Privacy</p>
                <h2>Privacy Policy</h2>
                <p className="muted">Last updated: October 5, 2026</p>
            </div>

            <div className="panel stack-sm">
                <h3>Summary</h3>
                <p>
                    Tigrigna Bible is a static Progressive Web App. We do not require accounts and we do not operate
                    a custom user database for bookmarks or notes.
                </p>
            </div>

            <div className="panel stack-sm">
                <h3>Data stored on your device</h3>
                <p>Reading preferences, bookmarks, highlights, notes, collections, and recent searches are stored
                    locally in your browser (for example via <code>localStorage</code>).</p>
                <p className="muted">Clearing site data in your browser removes this information.</p>
            </div>

            <div className="panel stack-sm">
                <h3>Hosting analytics</h3>
                <p>
                    When hosted on Vercel, anonymous usage and performance metrics may be collected through Vercel
                    Analytics and Speed Insights to understand traffic and reliability. These tools are designed to be
                    privacy-friendly and do not identify you personally for advertising.
                </p>
            </div>

            <div className="panel stack-sm">
                <h3>What we do not do</h3>
                <ul className="legal-list">
                    <li>We do not sell personal data</li>
                    <li>We do not show third-party advertising networks</li>
                    <li>We do not sync your notes or bookmarks to our own servers</li>
                </ul>
            </div>

            <div className="panel stack-sm">
                <h3>Contact</h3>
                <p>
                    Privacy questions:{' '}
                    <a
                        className="inline-link"
                        href="https://github.com/yoeltecleab/tigrigna-bible/issues"
                        target="_blank"
                        rel="noreferrer"
                    >
                        open a GitHub issue
                    </a>
                    . See also the <Link className="inline-link" to="/about">About</Link> page.
                </p>
            </div>
        </section>
    );
}
