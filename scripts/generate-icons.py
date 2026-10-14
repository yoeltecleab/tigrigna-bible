#!/usr/bin/env python3
"""Regenerate PWA / favicon assets from assets/brand/logo-source.png.

Apple / Android home-screen icons need a filled opaque tile. A logo floating on
white with heavy padding reads as a letter "T" (the cross) at 60pt sizes.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'assets' / 'brand' / 'logo-source.png'
OUT = ROOT / 'public' / 'icons'
VERSION = 'v4'

# Sacred Covenant parchment — matches launch / splash feel
BG = (251, 247, 232)  # #fbf7e8
BG_MASKABLE = (245, 240, 224)  # slightly deeper for adaptive icon edge


def knock_out_white(im: Image.Image, threshold: int = 242) -> Image.Image:
    """Source art ships with an opaque white plate — make it transparent."""
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
    cover: float = 0.78,
    bg: tuple[int, int, int] = BG,
    soft_vignette: bool = True,
) -> Image.Image:
    """Center the mark on a solid fill. OS applies squircle/circle — do not pre-round."""
    target = int(size * cover)
    fitted = mark.copy()
    fitted.thumbnail((target, target), Image.Resampling.LANCZOS)

    layer = Image.new('RGBA', (size, size), (*bg, 255))

    if soft_vignette and size >= 128:
        # Subtle center lift so the tile doesn't look like a flat white square
        vignette = Image.new('L', (size, size), 0)
        draw = ImageDraw.Draw(vignette)
        inset = int(size * 0.08)
        draw.ellipse((inset, inset, size - inset, size - inset), fill=28)
        vignette = vignette.filter(ImageFilter.GaussianBlur(radius=size * 0.12))
        warm = Image.new('RGBA', (size, size), (212, 175, 55, 255))
        layer = Image.composite(warm, layer, vignette)

    x = (size - fitted.width) // 2
    # Bias slightly upward so cross + book balance inside Apple's squircle
    y = (size - fitted.height) // 2 - int(size * 0.02)
    layer.paste(fitted, (x, max(0, y)), fitted)
    return layer.convert('RGB')


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f'Missing logo source: {SRC}')

    OUT.mkdir(parents=True, exist_ok=True)
    mark = trim_whitespace(knock_out_white(Image.open(SRC).convert('RGBA')))

    # "any" icons — large mark, full-bleed parchment (OS masks corners)
    for size in (192, 512):
        fit_mark(mark, size, cover=0.92, bg=BG).save(
            OUT / f'icon-{size}-{VERSION}.png', format='PNG', optimize=True
        )
        # Maskable: keep mark inside ~66% safe zone
        fit_mark(mark, size, cover=0.64, bg=BG_MASKABLE, soft_vignette=False).save(
            OUT / f'icon-{size}-maskable-{VERSION}.png', format='PNG', optimize=True
        )

    # Apple touch — square, no transparency, no pre-rounded corners
    apple = fit_mark(mark, 180, cover=0.94, bg=BG)
    apple.save(OUT / f'apple-touch-icon-{VERSION}.png', format='PNG', optimize=True)
    apple.save(ROOT / 'public' / 'apple-touch-icon.png', format='PNG', optimize=True)

    # Larger Apple sizes some iOS variants request
    fit_mark(mark, 167, cover=0.94, bg=BG).save(OUT / f'apple-touch-icon-167-{VERSION}.png', format='PNG', optimize=True)
    fit_mark(mark, 152, cover=0.94, bg=BG).save(OUT / f'apple-touch-icon-152-{VERSION}.png', format='PNG', optimize=True)

    fav32 = fit_mark(mark, 32, cover=0.94, bg=BG, soft_vignette=False)
    fav16 = fit_mark(mark, 16, cover=0.96, bg=BG, soft_vignette=False)
    fav32.save(OUT / f'favicon-32-{VERSION}.png', format='PNG', optimize=True)
    fav16.save(OUT / f'favicon-16-{VERSION}.png', format='PNG', optimize=True)
    fav32.save(ROOT / 'public' / 'favicon-32.png', format='PNG', optimize=True)

    print(f'Generated versioned icons ({VERSION}) from {SRC.name}')


if __name__ == '__main__':
    main()
