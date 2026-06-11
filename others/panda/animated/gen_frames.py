#!/usr/bin/env python3
# Genera 10 fotogramas del panda neutral para montar un GIF animado.
# Acción: habla de frente -> mueve brazo y cabeza para mostrarte algo
#         arriba a la derecha (de la imagen) -> lo presenta hablando.
# Cada SVG es plano y autocontenido (sin <use>) para que cualquier
# rasterizador (rsvg/ImageMagick/Inkscape) lo convierta sin problemas.
import os

OUT = os.path.dirname(os.path.abspath(__file__))
BLACK, WHITE, PINK = "#2b2b2b", "#ffffff", "#ff9ec2"
MOUTHC, TONG, INNER = "#8a4a4a", "#ff8fa3", "#5b4a4a"

# --- partes estáticas (piernas, calcetines, torso) -------------------------
STATIC = f'''  <g fill="{BLACK}" stroke="{WHITE}" stroke-width="0.875">
    <rect x="83.5" y="150" width="11" height="30" rx="5.5"/>
    <rect x="105.5" y="150" width="11" height="30" rx="5.5"/>
  </g>
  <g transform="rotate(-6 89 184)" stroke-linejoin="round">
    <path d="M84 170Q80 179 80 187Q80 196 89 196Q98 196 98 187Q98 179 94 170Z" fill="{WHITE}" stroke="{BLACK}" stroke-width="1.5"/>
    <path d="M80.2 185Q80.5 196 89 196Q97.5 196 97.8 185Q97 193.5 89 194Q81 193.5 80.2 185Z" fill="#000" opacity="0.11"/>
    <path d="M82 190Q83 196 89 196Q95 196 96 190Q95 194 89 194.6Q83 194 82 190Z" fill="#000" opacity="0.1"/>
    <rect x="81" y="168" width="16" height="6.5" rx="3.25" fill="{WHITE}" stroke="{BLACK}" stroke-width="1.5"/>
    <path d="M84 181H94" fill="none" stroke="{PINK}" stroke-width="2" stroke-linecap="round"/>
  </g>
  <g transform="rotate(6 111 184)" stroke-linejoin="round">
    <path d="M116 170Q120 179 120 187Q120 196 111 196Q102 196 102 187Q102 179 106 170Z" fill="{WHITE}" stroke="{BLACK}" stroke-width="1.5"/>
    <path d="M119.8 185Q119.5 196 111 196Q102.5 196 102.2 185Q103 193.5 111 194Q119 193.5 119.8 185Z" fill="#000" opacity="0.11"/>
    <path d="M118 190Q117 196 111 196Q105 196 104 190Q105 194 111 194.6Q117 194 118 190Z" fill="#000" opacity="0.1"/>
    <rect x="103" y="168" width="16" height="6.5" rx="3.25" fill="{WHITE}" stroke="{BLACK}" stroke-width="1.5"/>
    <path d="M106 181H116" fill="none" stroke="{PINK}" stroke-width="2" stroke-linecap="round"/>
  </g>'''

BODY = f'  <ellipse cx="100" cy="126" rx="27" ry="28" fill="{WHITE}" stroke="{BLACK}" stroke-width="3"/>'

# antebrazo afinado -> muñeca -> manita redonda (pelota); deditos = líneas finas
ARM_L = ("M82 116Q68 110 60 121L60 134Q58 138 58 147L58 152A2.75 2.75 0 0 0 63.5 152L63.5 147"
         "Q64.4 148.5 65.25 147L65.25 152.5A2.75 2.75 0 0 0 70.75 152.5L70.75 147Q71.6 148.5 72.5 147"
         "L72.5 152A2.75 2.75 0 0 0 78 152L78 147Q78 138 76 134L82 116Z")
ARM_R = ("M118 116Q132 110 140 121L140 134Q142 138 142 147L142 152A2.75 2.75 0 0 1 136.5 152L136.5 147"
         "Q135.6 148.5 134.75 147L134.75 152.5A2.75 2.75 0 0 1 129.25 152.5L129.25 147Q128.4 148.5 127.5 147"
         "L127.5 152A2.75 2.75 0 0 1 122 152L122 147Q122 138 124 134L118 116Z")

def arms(rot_l, rot_r):
    return (f'  <g fill="{BLACK}" stroke="{WHITE}" stroke-width="0.875" stroke-linejoin="round">\n'
            f'    <path d="{ARM_L}" transform="rotate({rot_l} 72 118)"/>\n'
            f'    <path d="{ARM_R}" transform="rotate({rot_r} 128 118)"/>\n'
            f'  </g>')

# --- bocas ------------------------------------------------------------------
def mouth(kind):
    if kind == "closed":
        return (f'<path d="M100 73V77M93 80Q100 83 107 80" fill="none" '
                f'stroke="{BLACK}" stroke-width="2.5" stroke-linecap="round"/>')
    lip = (f'<path d="M100 73V76" fill="none" stroke="{BLACK}" '
           f'stroke-width="2.5" stroke-linecap="round"/>')
    if kind == "mid":
        return lip + f'<ellipse cx="100" cy="81" rx="4" ry="3" fill="{MOUTHC}"/>'
    # open
    return (lip + f'<ellipse cx="100" cy="81" rx="5" ry="5.5" fill="{MOUTHC}"/>'
            f'<ellipse cx="100" cy="84.5" rx="3" ry="2.3" fill="{TONG}"/>')

def head(px, py, mouth_kind, tx, ty, rot):
    """Cabeza + cara. px,py = desplazamiento de pupilas; tx,ty,rot = transform del grupo."""
    return f'''  <g transform="translate({tx} {ty}) rotate({rot} 100 101)" stroke-linejoin="round">
    <g fill="{BLACK}" stroke="{WHITE}" stroke-width="0.875">
      <circle cx="64" cy="26" r="16"/><circle cx="136" cy="26" r="16"/>
    </g>
    <circle cx="64" cy="26" r="8" fill="{INNER}"/><circle cx="136" cy="26" r="8" fill="{INNER}"/>
    <circle cx="100" cy="56" r="46" fill="{WHITE}" stroke="{BLACK}" stroke-width="3"/>
    <g fill="{BLACK}">
      <path d="M71 29C63 33 67 55 80 62C90 66 97 56 94 47C93 34 81 26 71 29Z"/>
      <path d="M129 29C137 33 133 55 120 62C110 66 103 56 106 47C107 34 119 26 129 29Z"/>
    </g>
    <g fill="{BLACK}">
      <path d="M77 52Q83 47 91 59Q84 60 77 52Z" fill="{WHITE}"/>
      <path d="M123 52Q117 47 109 59Q116 60 123 52Z" fill="{WHITE}"/>
      <circle cx="{85+px}" cy="{55+py}" r="3.6"/><circle cx="{115+px}" cy="{55+py}" r="3.6"/>
      <circle cx="{84+px}" cy="{53+py}" r="1.4" fill="{WHITE}"/>
      <circle cx="{116+px}" cy="{53+py}" r="1.4" fill="{WHITE}"/>
    </g>
    <ellipse cx="100" cy="69" rx="5.8" ry="4" fill="{BLACK}"/>
    {mouth(mouth_kind)}
  </g>'''

# --- guion de la animación (10 fotogramas) ---------------------------------
# rot_r negativo = el brazo derecho sube y apunta arriba-derecha.
# rot_h positivo = la cabeza se inclina hacia la derecha; px,py = mirada.
FRAMES = [
    # px, py, boca,     rot_l, rot_r, tx, ty, rot_h   fase
    (0,  0, "closed",     0,    0,   0,  0,   0),   # 0  habla de frente
    (0,  0, "open",       0,    0,   0, -1,   0),   # 1
    (0,  0, "mid",        0,    0,   0,  0,   0),   # 2
    (1, -1, "open",       0,    0,   0, -1,   0),   # 3  anticipa el gesto
    (2, -2, "open",       6,  -38,  0,  0,   3),   # 4  empieza a girar/levantar
    (3, -3, "mid",        9,  -76,  1, -1,   6),   # 5
    (3, -3, "open",      11, -108,  1, -1,   9),   # 6
    (3, -3, "open",      12, -126,  2, -1,  10),   # 7  apunta arriba-derecha
    (3, -3, "closed",    12, -126,  2, -1,  10),   # 8  presenta (boca cerrada)
    (3, -3, "open",      12, -122,  2, -1,   9),   # 9  habla de lo que muestra
]

def frame(i, px, py, mk, rl, rr, tx, ty, rh):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="Panda neutral · frame {i}">
  <title>Panda neutral · frame {i}</title>
{STATIC}
{arms(rl, rr)}
{BODY}
{head(px, py, mk, tx, ty, rh)}
</svg>
'''

for i, f in enumerate(FRAMES):
    svg = frame(i, *f)
    with open(os.path.join(OUT, f"frame-{i:02d}.svg"), "w") as fh:
        fh.write(svg)
    print("escrito", f"frame-{i:02d}.svg")

print("\\nlisto · 10 fotogramas en", OUT)
