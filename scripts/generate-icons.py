#!/usr/bin/env python3
"""Regenerate PWA / favicon / iOS splash assets from assets/brand/logo-source.png.

Every install surface gets the cross+book mark on an opaque parchment tile, so no
platform ever falls back to a generated letter monogram.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'assets' / 'brand' / 'logo-source.png'
OUT = ROOT / 'public' / 'icons'
SPLASH_OUT = ROOT / 'public' / 'splash'
VERSION = 'v6'

BG = (251, 247, 232)  # #fbf7e8 parchment

# (css width, css height, device pixel ratio) for current iPhones / iPads, portrait.
SPLASH_DEVICES = [
    (440, 956, 3), (430, 932, 3), (402, 874, 3), (393, 852, 3), (428, 926, 3),
    (390, 844, 3), (375, 812, 3), (414, 896, 3), (414, 896, 2), (375, 667, 2),
    (320, 568, 2), (1032, 1376, 2), (1024, 1366, 2), (834, 1210, 2), (834, 1194, 2),
    (820, 1180, 2), (834, 1112, 2), (810, 1080, 2), (768, 1024, 2), (744, 1133, 2),
]


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


def trim(im: Image.Image) -> Image.Image:
    """Crop to the inked pixels; the source carries faint off-white noise to its edges."""
    ink = Image.new('L', im.size, 0)
    src, dst = im.load(), ink.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = src[x, y]
            if a > 10 and min(r, g, b) < 225:
                dst[x, y] = 255
    box = ink.getbbox()
    if not box:
        return im
    pad = 2
    return im.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad)))


def scaled(mark: Image.Image, max_w: int, max_h: int) -> Image.Image:
    """Resize up or down (Image.thumbnail never upscales, which left the mark tiny)."""
    ratio = min(max_w / mark.width, max_h / mark.height)
    return mark.resize((max(1, round(mark.width * ratio)), max(1, round(mark.height * ratio))), Image.Resampling.LANCZOS)


def tile(mark: Image.Image, size: int, cover: float) -> Image.Image:
    """Opaque square tile; the OS applies its own mask, so never pre-round."""
    fitted = scaled(mark, int(size * cover), int(size * cover))
    layer = Image.new('RGBA', (size, size), (*BG, 255))
    layer.alpha_composite(fitted, ((size - fitted.width) // 2, (size - fitted.height) // 2))
    return layer.convert('RGB')


def maskable(mark: Image.Image, size: int) -> Image.Image:
    """Keep the whole mark inside the 80% safe-zone circle."""
    diagonal = (mark.width ** 2 + mark.height ** 2) ** 0.5
    target = size * 0.78
    fitted = scaled(mark, int(mark.width * target / diagonal), int(mark.height * target / diagonal))
    layer = Image.new('RGBA', (size, size), (*BG, 255))
    layer.alpha_composite(fitted, ((size - fitted.width) // 2, (size - fitted.height) // 2))
    return layer.convert('RGB')


def splash(mark: Image.Image, width: int, height: int) -> Image.Image:
    edge = int(min(width, height) * 0.36)
    fitted = scaled(mark, edge, edge)
    layer = Image.new('RGBA', (width, height), (*BG, 255))
    layer.alpha_composite(fitted, ((width - fitted.width) // 2, (height - fitted.height) // 2 - int(height * 0.03)))
    return layer.convert('RGB')


def save(im: Image.Image, path: Path) -> None:
    im.save(path, format='PNG', optimize=True)


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f'Missing logo source: {SRC}')

    OUT.mkdir(parents=True, exist_ok=True)
    SPLASH_OUT.mkdir(parents=True, exist_ok=True)
    for stale in [*OUT.glob('*-v[0-9]*.png'), *SPLASH_OUT.glob('*.png')]:
        stale.unlink()

    mark = trim(knock_out_white(Image.open(SRC).convert('RGBA')))

    for size in (192, 512):
        save(tile(mark, size, 0.84), OUT / f'icon-{size}-{VERSION}.png')
        save(maskable(mark, size), OUT / f'icon-{size}-maskable-{VERSION}.png')
    save(tile(mark, 512, 0.84), OUT / 'logo.png')

    apple = tile(mark, 180, 0.84)
    save(apple, OUT / f'apple-touch-icon-{VERSION}.png')
    save(apple, OUT / 'apple-touch-icon.png')
    save(apple, ROOT / 'public' / 'apple-touch-icon.png')
    save(apple, ROOT / 'public' / 'apple-touch-icon-precomposed.png')

    fav32 = tile(mark, 32, 0.94)
    save(fav32, OUT / f'favicon-32-{VERSION}.png')
    save(fav32, ROOT / 'public' / 'favicon-32.png')
    save(tile(mark, 16, 0.96), OUT / f'favicon-16-{VERSION}.png')
    tile(mark, 48, 0.92).save(ROOT / 'public' / 'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])

    links = []
    for css_w, css_h, dpr in SPLASH_DEVICES:
        name = f'splash-{css_w * dpr}x{css_h * dpr}.png'
        save(splash(mark, css_w * dpr, css_h * dpr), SPLASH_OUT / name)
        links.append(
            f'<link rel="apple-touch-startup-image" href="/splash/{name}" media="(device-width: {css_w}px) and '
            f'(device-height: {css_h}px) and (-webkit-device-pixel-ratio: {dpr}) and (orientation: portrait)"/>'
        )
    index = ROOT / 'index.html'
    html = index.read_text(encoding='utf-8')
    start, end = '<!-- splash:start -->', '<!-- splash:end -->'
    if start in html and end in html:
        before, rest = html.split(start, 1)
        _, after = rest.split(end, 1)
        block = '\n'.join(f'        {link}' for link in links)
        index.write_text(f'{before}{start}\n{block}\n        {end}{after}', encoding='utf-8')

    print(f'Generated {VERSION} icons, favicon.ico and {len(SPLASH_DEVICES)} iOS splash screens from {SRC.name}')


if __name__ == '__main__':
    main()
