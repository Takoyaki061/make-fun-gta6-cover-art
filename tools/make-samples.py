#!/usr/bin/env python3
"""Makes the three sample photos the cover app ships with.

Each one is a stylised illustration drawn from scratch with PIL: a
palm-lined boulevard at sunset, a neon night street, and a pier over
turquoise water. No real person, no photograph, no borrowed artwork.
Run from the repository root: python3 tools/make-samples.py
"""
import math
import random
from PIL import Image, ImageDraw

W, H = 1200, 900
OUT = "app/samples"


def sky(draw, top, mid, bottom):
    for y in range(H):
        t = y / H
        if t < 0.55:
            f = t / 0.55
            c = tuple(int(top[i] + (mid[i] - top[i]) * f) for i in range(3))
        else:
            f = (t - 0.55) / 0.45
            c = tuple(int(mid[i] + (bottom[i] - mid[i]) * f) for i in range(3))
        draw.line([(0, y), (W, y)], fill=c)


def sun(draw, cx, cy, r, colour, glow):
    for i in range(6, 0, -1):
        rr = r + i * 26
        draw.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=glow)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=colour)


def palm(draw, x, base_y, height, lean, colour):
    """A palm silhouette: curved trunk, seven drooping fronds."""
    top_x = x + lean
    top_y = base_y - height
    pts = []
    for i in range(21):
        t = i / 20
        px = x + (top_x - x) * t * t + lean * 0.15 * math.sin(t * math.pi)
        py = base_y - height * t
        pts.append((px, py))
    draw.line(pts, fill=colour, width=max(8, height // 28), joint="curve")
    for k in range(7):
        ang = math.pi * (0.08 + 0.84 * k / 6)
        L = height * 0.42
        x1 = top_x + math.cos(ang) * L * 0.9
        y1 = top_y + math.sin(ang) * L * 0.55 + height * 0.10
        mx = top_x + math.cos(ang) * L * 0.5
        my = top_y + math.sin(ang) * L * 0.28 - height * 0.06
        draw.line([(top_x, top_y), (mx, my), (x1, y1)], fill=colour,
                  width=max(5, height // 45), joint="curve")
        for j in range(1, 4):
            f = j / 4
            lx = top_x + (x1 - top_x) * f
            ly = top_y + (y1 - top_y) * f
            draw.line([(lx, ly), (lx - 14, ly + 22)], fill=colour, width=3)


def buildings(draw, horizon, colour, seed):
    rnd = random.Random(seed)
    x = -20
    while x < W:
        bw = rnd.randint(70, 170)
        bh = rnd.randint(90, 320)
        draw.rectangle([x, horizon - bh, x + bw, horizon], fill=colour)
        for wy in range(horizon - bh + 18, horizon - 14, 34):
            for wx in range(x + 14, x + bw - 12, 30):
                if rnd.random() < 0.5:
                    draw.rectangle([wx, wy, wx + 12, wy + 16],
                                   fill=(255, 214, 130))
        x += bw + rnd.randint(6, 30)


def boulevard():
    img = Image.new("RGB", (W, H), (20, 10, 40))
    d = ImageDraw.Draw(img)
    sky(d, (64, 24, 96), (255, 94, 98), (255, 178, 92))
    sun(d, 620, 470, 110, (255, 236, 170), (255, 120, 90))
    horizon = 640
    buildings(d, horizon, (38, 16, 54), 7)
    d.rectangle([0, horizon, W, H], fill=(24, 10, 34))
    d.polygon([(0, horizon), (W, horizon), (W, H), (0, H)], fill=(30, 12, 40))
    for i, x in enumerate(range(60, W, 190)):
        d.line([(x, H), (620 + (x - 620) // 3, horizon)], fill=(255, 190, 120), width=4)
    palm(d, 90, H, 520, 90, (12, 5, 20))
    palm(d, 1120, H, 470, -80, (12, 5, 20))
    palm(d, 250, H + 40, 380, 60, (16, 7, 24))
    # Convertible silhouette with a driver figure.
    d.rounded_rectangle([380, 690, 820, 800], radius=28, fill=(178, 24, 44))
    d.polygon([(470, 690), (520, 620), (700, 620), (760, 690)], fill=(30, 12, 30))
    d.ellipse([430, 770, 510, 850], fill=(12, 8, 14))
    d.ellipse([700, 770, 780, 850], fill=(12, 8, 14))
    d.ellipse([560, 560, 640, 640], fill=(44, 22, 30))  # head
    d.rounded_rectangle([545, 630, 655, 700], radius=18, fill=(240, 220, 200))  # shirt
    return img


def neon_street():
    img = Image.new("RGB", (W, H), (10, 8, 28))
    d = ImageDraw.Draw(img)
    sky(d, (12, 8, 40), (40, 16, 80), (90, 24, 90))
    horizon = 620
    buildings(d, horizon, (14, 10, 34), 21)
    d.rectangle([0, horizon, W, H], fill=(16, 12, 30))
    # Wet pavement reflections.
    rnd = random.Random(4)
    for _ in range(60):
        x = rnd.randint(0, W)
        y = rnd.randint(horizon + 20, H - 20)
        c = rnd.choice([(255, 60, 170), (40, 220, 255), (255, 170, 60)])
        d.line([(x, y), (x + rnd.randint(20, 90), y)], fill=c, width=3)
    # Neon signs.
    for x, word, c in [(90, "DINER", (255, 60, 170)), (760, "HOTEL", (40, 220, 255)),
                       (420, "24H", (255, 190, 60))]:
        d.rectangle([x - 14, 210, x + 190, 300], outline=c, width=6)
        d.text((x, 228), word, fill=c)
    # Two friends laughing, mid-frame and small enough to read as people:
    # heads, shirts, arms mid-gesture, legs, standing on wet pavement.
    for x, shirt, skin in [(500, (255, 90, 140), (214, 164, 132)),
                           (640, (60, 200, 220), (180, 130, 100))]:
        d.ellipse([x + 8, 560, x + 52, 604], fill=skin)  # head
        d.arc([x + 8, 556, x + 52, 590], 180, 360, fill=(30, 20, 24), width=6)  # hair
        d.rounded_rectangle([x, 604, x + 60, 700], radius=14, fill=shirt)
        d.line([(x + 4, 620), (x - 26, 660)], fill=skin, width=9)  # arm out
        d.line([(x + 56, 620), (x + 86, 648)], fill=skin, width=9)  # arm up
        d.rectangle([x + 6, 700, x + 26, 800], fill=(28, 22, 38))
        d.rectangle([x + 34, 700, x + 54, 800], fill=(28, 22, 38))
    # A low car silhouette parked at the kerb.
    d.rounded_rectangle([820, 700, 1140, 800], radius=26, fill=(24, 18, 40))
    d.polygon([(880, 700), (920, 640), (1040, 640), (1080, 700)], fill=(40, 28, 60))
    d.ellipse([860, 770, 930, 830], fill=(8, 6, 12))
    d.ellipse([1030, 770, 1100, 830], fill=(8, 6, 12))
    palm(d, 60, H, 430, 70, (8, 4, 16))
    palm(d, 1150, H, 400, -60, (8, 4, 16))
    return img


def pier():
    img = Image.new("RGB", (W, H), (20, 60, 90))
    d = ImageDraw.Draw(img)
    sky(d, (30, 90, 140), (120, 200, 220), (255, 190, 130))
    sun(d, 300, 300, 90, (255, 240, 190), (255, 180, 120))
    horizon = 560
    d.rectangle([0, horizon, W, H], fill=(18, 140, 160))
    for i in range(14):
        y = horizon + 30 + i * 22
        d.line([(0, y), (W, y)], fill=(120, 220, 230), width=2)
    # Wooden pier from the bottom corner.
    d.polygon([(0, H), (0, 700), (700, 560), (900, 560), (900, H)], fill=(96, 62, 36))
    for x in range(0, 900, 46):
        d.line([(x, 640), (x + 20, 560)], fill=(70, 44, 24), width=3)
    # Angler with bucket hat and rod.
    d.ellipse([620, 380, 680, 440], fill=(90, 60, 40))  # head
    d.pieslice([600, 380, 700, 430], 180, 360, fill=(240, 230, 210))  # hat
    d.rounded_rectangle([610, 440, 690, 600], radius=20, fill=(245, 245, 240))
    d.line([(680, 460), (980, 180)], fill=(40, 26, 18), width=5)
    d.line([(980, 180), (980, 300)], fill=(220, 230, 240), width=2)
    palm(d, 1050, 600, 380, -50, (16, 40, 30))
    return img


if __name__ == "__main__":
    import os
    os.makedirs(OUT, exist_ok=True)
    for name, fn in [("boulevard", boulevard), ("neon", neon_street), ("pier", pier)]:
        fn().save(f"{OUT}/{name}.jpg", quality=88)
        print("wrote", f"{OUT}/{name}.jpg")
