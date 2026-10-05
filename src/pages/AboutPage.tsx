export default function AboutPage() {
    return (
        <section className="stack-lg legal-page">
            <div className="panel hero-panel stack-sm">
                <p className="eyebrow">About</p>
                <h2>Tigrigna Bible</h2>
                <p className="muted">
                    ወንጌል ቅዱስ — an offline-capable Progressive Web App for reading, searching, bookmarking, and
                    sharing the Bible in Tigrigna.
                </p>
            </div>

            <div className="panel stack-sm">
                <h3>Features</h3>
                <ul className="legal-list">
                    <li>Full Tigrigna Bible library with Old and New Testament navigation</li>
                    <li>Offline reading after the first visit (service worker + content cache)</li>
                    <li>Fast search, bookmarks, highlights, notes, and collections</li>
                    <li>Installable on phones and desktops as a PWA</li>
                </ul>
            </div>

            <div className="panel stack-sm">
                <h3>Scripture attribution</h3>
                <p>
                    The Tigrigna scripture text bundled in this app is provided for personal study and devotion.
                    If you are the rights holder of a translation included here, or know the precise published source,
                    please contact the maintainer so attribution can be corrected or content removed.
                </p>
                <p className="muted">
                    Translation source field (fill before public launch if known):{' '}
                    <strong>Tigrigna Bible digital corpus — rights pending confirmation</strong>.
                </p>
                <p>
                    This application UI, design, and software are © {new Date().getFullYear()} Tigrigna Bible
                    project contributors. Scripture text remains the property of its respective copyright holders.
                </p>
            </div>

            <div className="panel stack-sm">
                <h3>Contact</h3>
                <p>
                    Questions, licensing notices, or takedown requests:{' '}
                    <a className="inline-link" href="mailto:hello@tigrigna-bible.app">
                        hello@tigrigna-bible.app
                    </a>
                    .
                </p>
            </div>
        </section>
    );
}
