#!/usr/bin/env python3
"""Regenerate PWA / favicon assets from assets/brand/logo-source.png.

Uses the cross+book mark on a parchment tile so home-screen install never falls
back to a letter/word monogram from the app short name.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'assets' / 'brand' / 'logo-source.png'
OUT = ROOT / 'public' / 'icons'
VERSION = 'v5'

# Sacred Covenant parchment
BG = (251, 247, 232)  # #fbf7e8
BG_MASKABLE = (245, 240, 224)


def knock_out_white(im: Image.Image, threshold: int = 242) -> Image.Image:
    out = im.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0 and r >= threshold and g >= threshold and b >= threshold:
                px[x, y] = (r, g, b, 0)
    return out


def trim_whitespace(im: Image.Image, threshold: int = 245) -> Image.Image:
    px = im.load()
    w, h = im.size
    left, top, right, bottom = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 10 and not (r >= threshold and g >= threshold and b >= threshold):
                found = True
                left = min(left, x)
                top = min(top, y)
                right = max(right, x)
                bottom = max(bottom, y)
    if not found:
        return im
    pad = 2
    return im.crop((max(0, left - pad), max(0, top - pad), min(w, right + 1 + pad), min(h, bottom + 1 + pad)))


def fit_mark(
    mark: Image.Image,
    size: int,
    *,
    cover: float = 0.86,
    bg: tuple[int, int, int] = BG,
) -> Image.Image:
    """Solid opaque tile; OS applies squircle — do not pre-round."""
    target = int(size * cover)
    fitted = mark.copy()
    fitted.thumbnail((target, target), Image.Resampling.LANCZOS)

    layer = Image.new('RGBA', (size, size), (*bg, 255))
    x = (size - fitted.width) // 2
    y = (size - fitted.height) // 2 - int(size * 0.015)
    layer.paste(fitted, (x, max(0, y)), fitted)
    return layer.convert('RGB')


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f'Missing logo source: {SRC}')

    OUT.mkdir(parents=True, exist_ok=True)
    mark = trim_whitespace(knock_out_white(Image.open(SRC).convert('RGBA')))

    for size in (192, 512):
        icon = fit_mark(mark, size, cover=0.88, bg=BG)
        icon.save(OUT / f'icon-{size}-{VERSION}.png', format='PNG', optimize=True)
        fit_mark(mark, size, cover=0.66, bg=BG_MASKABLE).save(
            OUT / f'icon-{size}-maskable-{VERSION}.png', format='PNG', optimize=True
        )

    # Canonical logo for brand UI + install / social fallbacks
    fit_mark(mark, 512, cover=0.88, bg=BG).save(OUT / 'logo.png', format='PNG', optimize=True)

    apple = fit_mark(mark, 180, cover=0.9, bg=BG)
    apple.save(OUT / f'apple-touch-icon-{VERSION}.png', format='PNG', optimize=True)
    apple.save(ROOT / 'public' / 'apple-touch-icon.png', format='PNG', optimize=True)
    # iOS sometimes prefers /apple-touch-icon.png at root — keep logo duplicate at icons/
    apple.save(OUT / 'apple-touch-icon.png', format='PNG', optimize=True)

    fit_mark(mark, 167, cover=0.9, bg=BG).save(OUT / f'apple-touch-icon-167-{VERSION}.png', format='PNG', optimize=True)
    fit_mark(mark, 152, cover=0.9, bg=BG).save(OUT / f'apple-touch-icon-152-{VERSION}.png', format='PNG', optimize=True)

    fav48 = fit_mark(mark, 48, cover=0.9, bg=BG)
    fav32 = fit_mark(mark, 32, cover=0.92, bg=BG)
    fav16 = fit_mark(mark, 16, cover=0.94, bg=BG)
    fav32.save(OUT / f'favicon-32-{VERSION}.png', format='PNG', optimize=True)
    fav16.save(OUT / f'favicon-16-{VERSION}.png', format='PNG', optimize=True)
    fav32.save(ROOT / 'public' / 'favicon-32.png', format='PNG', optimize=True)

    # Multi-size ICO so browsers don't invent a letter glyph
    fav48.save(
        ROOT / 'public' / 'favicon.ico',
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    print(f'Generated logo icons ({VERSION}) from {SRC.name} → public/icons/logo.png + favicon.ico')


if __name__ == '__main__':
    main()
