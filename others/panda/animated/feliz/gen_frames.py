#!/usr/bin/env python3
# Genera 10 fotogramas del panda FELIZ para montar un GIF de celebración.
# Acción: salta de alegría dando dos botes, con los dos brazos levantados
#         bombeando arriba (cheer), la cabeza meciéndose y la sonrisota
#         abriéndose y cerrándose ("¡yay yay!").
# Cada SVG es plano y autocontenido (sin <use>) para que cualquier
# rasterizador (cairosvg/rsvg/ImageMagick) lo convierta sin problemas.
import os

OUT = os.path.dirname(os.path.abspath(__file__))
BLACK, WHITE, PINK = "#2b2b2b", "#ffffff", "#ff9ec2"
MOUTHC, TONG, INNER, BLUSH = "#8a4a4a", "#ff8fa3", "#5b4a4a", "#ffb3c1"

# --- partes estáticas (piernas, calcetines, torso) -------------------------
STATIC = f'''  <g fill="{BLACK}" stroke="{WHITE}" stroke-width="1.75">
    <rect x="83.5" y="150" width="11" height="30" rx="5.5"/>
    <rect x="105.5" y="150" width="11" height="30" rx="5.5"/>
  </g>
  <g fill="{WHITE}" stroke="{BLACK}" stroke-width="1.5">
    <rect x="81.5" y="169" width="15" height="25" rx="7.5"/>
    <rect x="80.5" y="167" width="17" height="7" rx="3.5"/>
    <rect x="103.5" y="169" width="15" height="25" rx="7.5"/>
    <rect x="102.5" y="167" width="17" height="7" rx="3.5"/>
  </g>
  <g fill="none" stroke="{PINK}" stroke-width="2" stroke-linecap="round">
    <path d="M83 180H95"/><path d="M105 180H117"/>
  </g>
  <ellipse cx="100" cy="126" rx="27" ry="28" fill="{WHITE}" stroke="{BLACK}" stroke-width="3"/>'''

# brazos con manita de dedos gordos y largos (estilo feliz), girados desde el hombro
ARM_L = ("M77 113Q77 107 69 107Q60 108 59 120L59 141"
         "a3 8 0 0 0 6 0a3 8 0 0 0 6 0a3 8 0 0 0 6 0L77 113Z")
ARM_R = ("M123 113Q123 107 131 107Q140 108 141 120L141 141"
         "a3 8 0 0 1 -6 0a3 8 0 0 1 -6 0a3 8 0 0 1 -6 0L123 113Z")

def arms(rot_l, rot_r):
    return (f'  <g fill="{BLACK}" stroke="{WHITE}" stroke-width="1.75" stroke-linejoin="round">\n'
            f'    <path d="{ARM_L}" transform="rotate({rot_l} 77 113)"/>\n'
            f'    <path d="{ARM_R}" transform="rotate({rot_r} 123 113)"/>\n'
            f'  </g>')

# --- bocas (sonrisota feliz) -----------------------------------------------
def mouth(kind):
    lip = (f'<path d="M100 73V76" fill="none" stroke="{BLACK}" '
           f'stroke-width="2.5" stroke-linecap="round"/>')
    if kind == "mid":
        return (lip + f'<path d="M86 79Q100 94 114 79Q100 86 86 79Z" fill="{MOUTHC}"/>'
                f'<path d="M92 86Q100 92 108 86Q100 89 92 86Z" fill="{TONG}"/>')
    # open: sonrisota exagerada
    return (lip + f'<path d="M82 78Q100 101 118 78Q100 88 82 78Z" fill="{MOUTHC}"/>'
            f'<path d="M91 87Q100 96 109 87Q100 91 91 87Z" fill="{TONG}"/>')

def head(mouth_kind, tx, ty, rot):
    """Cabeza + cara feliz; tx,ty,rot = transform del grupo (mecer la cabeza)."""
    return f'''  <g transform="translate({tx} {ty}) rotate({rot} 100 101)" stroke-linejoin="round">
    <g fill="{BLACK}" stroke="{WHITE}" stroke-width="1.75">
      <circle cx="64" cy="26" r="16"/><circle cx="136" cy="26" r="16"/>
    </g>
    <circle cx="64" cy="26" r="8" fill="{INNER}"/><circle cx="136" cy="26" r="8" fill="{INNER}"/>
    <circle cx="100" cy="56" r="46" fill="{WHITE}" stroke="{BLACK}" stroke-width="3"/>
    <g fill="{BLACK}">
      <path d="M70 28C60 31 62 50 76 61C87 69 100 60 96 48C95 32 81 24 70 28Z"/>
      <path d="M130 28C140 31 138 50 124 61C113 69 100 60 104 48C105 32 119 24 130 28Z"/>
    </g>
    <g>
      <path d="M76 50Q88 46 94 60Q82 64 76 50Z" fill="{WHITE}"/>
      <path d="M124 50Q112 46 106 60Q118 64 124 50Z" fill="{WHITE}"/>
      <circle cx="86" cy="55" r="4.6" fill="{BLACK}"/><circle cx="114" cy="55" r="4.6" fill="{BLACK}"/>
      <circle cx="84" cy="52.5" r="1.8" fill="{WHITE}"/><circle cx="116" cy="52.5" r="1.8" fill="{WHITE}"/>
      <circle cx="88" cy="58" r="1" fill="{WHITE}"/><circle cx="112" cy="58" r="1" fill="{WHITE}"/>
    </g>
    <ellipse cx="100" cy="69" rx="5.8" ry="4" fill="{BLACK}"/>
    {mouth(mouth_kind)}
    <g fill="{BLUSH}" opacity="0.8">
      <ellipse cx="70" cy="67" rx="7" ry="4"/><ellipse cx="130" cy="67" rx="7" ry="4"/>
    </g>
  </g>'''

# --- guion de la animación (10 fotogramas) ---------------------------------
# dy = bote de todo el cuerpo (negativo = sube); rl/rr = brazos (más grados =
# más arriba); mk = boca; tx,ty,rh = mecer la cabeza.
FRAMES = [
    # dy,  rl,   rr,   boca,  tx, ty, rh
    (  0, 110, -110, "open",  0,  0,   0),  # 0  arranque, brazos arriba
    ( -4, 122, -122, "open",  0, -1,   3),  # 1  sube, brazos más altos, ladea dcha
    ( -9, 136, -136, "open",  0, -1,   5),  # 2  cima del salto, brazos al máximo
    ( -4, 126, -126, "mid",   0,  0,   3),  # 3  baja
    (  0, 112, -112, "open",  0,  0,   0),  # 4  aterriza
    ( -3, 120, -120, "open",  0, -1,  -3),  # 5  botecito, ladea izda
    ( -8, 134, -134, "open",  0, -1,  -5),  # 6  segunda cima
    ( -3, 124, -124, "mid",   0,  0,  -3),  # 7  baja
    (  0, 108, -108, "open",  0,  0,   0),  # 8  aterriza
    ( -2, 116, -116, "open",  0,  0,   2),  # 9  rebote suave -> vuelve al bucle
]

def frame(i, dy, rl, rr, mk, tx, ty, rh):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="Panda feliz · frame {i}">
  <title>Panda feliz celebrando · frame {i}</title>
  <g transform="translate(0 {dy})">
{STATIC}
{arms(rl, rr)}
{head(mk, tx, ty, rh)}
  </g>
</svg>
'''

for i, f in enumerate(FRAMES):
    svg = frame(i, *f)
    with open(os.path.join(OUT, f"frame-{i:02d}.svg"), "w") as fh:
        fh.write(svg)
    print("escrito", f"frame-{i:02d}.svg")

print("\nlisto · 10 fotogramas en", OUT)
