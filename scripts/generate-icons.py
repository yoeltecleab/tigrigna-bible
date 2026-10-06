#!/usr/bin/env python3
"""Regenerate PWA / favicon assets from public/icons/logo-source.png."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'assets' / 'brand' / 'logo-source.png'
OUT = ROOT / 'public' / 'icons'
VERSION = 'v3'


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


def fit_mark(mark: Image.Image, size: int, cover: float = 0.72, bg=(255, 255, 255), rounded: bool = False, radius_ratio: float = 0.18) -> Image.Image:
    target = int(size * cover)
    fitted = mark.copy()
    fitted.thumbnail((target, target), Image.Resampling.LANCZOS)
    layer = Image.new('RGBA', (size, size), (*bg, 255))
    x = (size - fitted.width) // 2
    y = (size - fitted.height) // 2
    layer.paste(fitted, (x, y), fitted)
    out = layer.convert('RGB')
    if not rounded:
        return out

    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size, size), radius=int(size * radius_ratio), fill=255)
    rgba = out.convert('RGBA')
    rgba.putalpha(mask)
    base = Image.new('RGB', (size, size), bg)
    base.paste(rgba, mask=rgba.split()[-1])
    return base


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f'Missing logo source: {SRC}')

    OUT.mkdir(parents=True, exist_ok=True)
    mark = trim_whitespace(Image.open(SRC).convert('RGBA'))

    for size in (192, 512):
        fit_mark(mark, size, cover=0.78, rounded=True).save(OUT / f'icon-{size}-{VERSION}.png', format='PNG', optimize=True)
        fit_mark(mark, size, cover=0.66, rounded=False).save(OUT / f'icon-{size}-maskable-{VERSION}.png', format='PNG', optimize=True)

    apple = fit_mark(mark, 180, cover=0.82, rounded=False)
    apple.save(OUT / f'apple-touch-icon-{VERSION}.png', format='PNG', optimize=True)
    apple.save(ROOT / 'public' / 'apple-touch-icon.png', format='PNG', optimize=True)

    fav32 = fit_mark(mark, 32, cover=0.86, rounded=False)
    fav16 = fit_mark(mark, 16, cover=0.9, rounded=False)
    fav32.save(OUT / f'favicon-32-{VERSION}.png', format='PNG', optimize=True)
    fav16.save(OUT / f'favicon-16-{VERSION}.png', format='PNG', optimize=True)
    fav32.save(ROOT / 'public' / 'favicon-32.png', format='PNG', optimize=True)

    print(f'Generated versioned icons ({VERSION}) from {SRC.name}')


if __name__ == '__main__':
    main()
