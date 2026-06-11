#!/usr/bin/env python3
# Rasteriza frame-00..09.svg y monta panda-feliz-celebra.gif
# Reutiliza el venv del panda neutral:  ../.venv/bin/python build_gif.py
import glob, io, os
import cairosvg
from PIL import Image

OUT = os.path.dirname(os.path.abspath(__file__))
SIZE = 240          # px del GIF
DURATIONS_MS = [    # celebración enérgica: rápida en los botes, breve respiro arriba
    150, 110, 170, 130,   # 0-3 primer salto
    150, 110, 170, 130,   # 4-7 segundo salto
    150, 150,             # 8-9 aterriza y rebota
]

def raster(path):
    png = cairosvg.svg2png(url=path, output_width=SIZE, output_height=SIZE,
                           background_color="white")
    return Image.open(io.BytesIO(png)).convert("RGB")

frames_svg = sorted(glob.glob(os.path.join(OUT, "frame-*.svg")))
imgs = [raster(p) for p in frames_svg]
gif = os.path.join(OUT, "panda-feliz-celebra.gif")
imgs[0].save(gif, save_all=True, append_images=imgs[1:],
             duration=DURATIONS_MS, loop=0, disposal=2, optimize=True)
print(f"montado {gif}  ({len(imgs)} fotogramas, {SIZE}px)")
