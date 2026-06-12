#!/usr/bin/env python3
# Rasteriza frame-00..09.svg y monta panda-neutral-open.gif
# Requiere un venv con cairosvg + pillow:  .venv/bin/python build_gif.py
# (o reutiliza el de la animacion vecina: ../.venv/bin/python build_gif.py)
import glob, io, os
import cairosvg
from PIL import Image

OUT = os.path.dirname(os.path.abspath(__file__))
SIZE = 240          # px del GIF
DURATIONS_MS = [    # tiempo por fotograma
    420,            # 0 reposo
    160,            # 1 anticipacion (rapida)
    110, 110, 120,  # 2-4 abriendo los brazos
    460,            # 5 brazos abiertos (mantiene el "ta-da")
    220, 220, 220,  # 6-8 sostiene / comenta
    420,            # 9 cierra el gesto
]

def raster(path):
    png = cairosvg.svg2png(url=path, output_width=SIZE, output_height=SIZE,
                           background_color="white")
    return Image.open(io.BytesIO(png)).convert("RGB")

frames_svg = sorted(glob.glob(os.path.join(OUT, "frame-*.svg")))
imgs = [raster(p) for p in frames_svg]
gif = os.path.join(OUT, "panda-neutral-open.gif")
imgs[0].save(gif, save_all=True, append_images=imgs[1:],
             duration=DURATIONS_MS, loop=0, disposal=2, optimize=True)
print(f"montado {gif}  ({len(imgs)} fotogramas, {SIZE}px)")
