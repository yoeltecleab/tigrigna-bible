import {Link} from 'react-router-dom';

export default function NotFoundPage() {
    return (
        <section className="empty-state">
            <h2>Page not found</h2>
            <p>The link is invalid or no longer available.</p>
            <Link className="btn" to="/">
                Go back to library
            </Link>
        </section>
    );
}
