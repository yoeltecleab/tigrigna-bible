/** Optional soft background glow (Settings › Background effects). Never rendered in the reader. */
export default function AmbientScene() {
    return (
        <div className="ambient-scene" aria-hidden="true">
            <div className="ambient-glow ambient-glow-a" />
            <div className="ambient-glow ambient-glow-b" />
        </div>
    );
}
