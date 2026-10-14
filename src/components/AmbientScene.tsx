import {useEffect, useRef} from 'react';

/** Atmospheric background — PS Price Scene parity (spotlight, orbs, grid, scanlines). */
export default function AmbientScene() {
    const spotlightRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef(0);
    const lastRef = useRef(0);
    const targetRef = useRef({x: 0, y: 0});
    const currentRef = useRef({x: 0, y: 0});

    useEffect(() => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const finePointer = window.matchMedia('(pointer: fine)').matches;
        if (reduceMotion || !finePointer) return;

        const spring = () => {
            const cur = currentRef.current;
            const tgt = targetRef.current;
            cur.x += (tgt.x - cur.x) * 0.12;
            cur.y += (tgt.y - cur.y) * 0.12;
            const el = spotlightRef.current;
            if (el) {
                el.style.background = `radial-gradient(600px circle at ${cur.x}px ${cur.y}px, var(--beam), transparent 65%)`;
            }
            rafRef.current = requestAnimationFrame(spring);
        };

        const onMove = (e: MouseEvent) => {
            const now = performance.now();
            if (now - lastRef.current < 32) return;
            lastRef.current = now;
            targetRef.current = {x: e.clientX, y: e.clientY};
        };

        window.addEventListener('mousemove', onMove, {passive: true});
        rafRef.current = requestAnimationFrame(spring);
        return () => {
            window.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <div className="ambient-scene" aria-hidden="true">
            <div className="ambient-base" />
            <div className="ambient-spotlight" ref={spotlightRef} />
            <div className="ambient-beam ambient-beam-a" />
            <div className="ambient-beam ambient-beam-b" />
            <div className="ambient-beam ambient-beam-c" />
            <div className="ambient-grid" />
            <div className="ambient-grain" />
            <div className="ambient-scanlines" />
        </div>
    );
}
