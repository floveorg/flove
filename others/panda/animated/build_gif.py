#!/usr/bin/env python3
# Rasteriza frame-00..09.svg y monta panda-neutral-talk.gif
# Requiere el venv local:  .venv/bin/python build_gif.py
import glob, io, os
import cairosvg
from PIL import Image

OUT = os.path.dirname(os.path.abspath(__file__))
SIZE = 240          # px del GIF
DURATIONS_MS = [    # tiempo por fotograma (habla rápido, gesto algo más lento)
    260, 180, 180, 220,      # 0-3 hablando
    150, 150, 150, 180,      # 4-7 gira y levanta el brazo
    520, 300,                # 8-9 presenta / comenta
]

def raster(path):
    png = cairosvg.svg2png(url=path, output_width=SIZE, output_height=SIZE,
                           background_color="white")
    return Image.open(io.BytesIO(png)).convert("RGB")

frames_svg = sorted(glob.glob(os.path.join(OUT, "frame-*.svg")))
imgs = [raster(p) for p in frames_svg]
gif = os.path.join(OUT, "panda-neutral-talk.gif")
imgs[0].save(gif, save_all=True, append_images=imgs[1:],
             duration=DURATIONS_MS, loop=0, disposal=2, optimize=True)
print(f"montado {gif}  ({len(imgs)} fotogramas, {SIZE}px)")
