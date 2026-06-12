#!/usr/bin/env python3
# Genera 10 fotogramas del panda neutral para montar un GIF animado.
# Accion: parte en reposo (brazos colgando) -> ABRE los brazos/manos hacia
#         fuera, simetrico, como presentando o dando la bienvenida ("abrirse")
#         -> sostiene la pose abierta mientras habla.
# Mismo metodo que ../gen_frames.py (animacion "te habla y te muestra algo"):
# cada SVG es plano y autocontenido (sin <use>) para que cualquier
# rasterizador (rsvg/ImageMagick/Inkscape/cairosvg) lo convierta sin problemas.
import os

OUT = os.path.dirname(os.path.abspath(__file__))
BLACK, WHITE, PINK = "#2b2b2b", "#ffffff", "#ff9ec2"
MOUTHC, TONG, INNER = "#8a4a4a", "#ff8fa3", "#5b4a4a"

# --- partes estaticas (piernas, calcetines, torso) -------------------------
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

# brazo fino tipo gorila (hombro redondeado, oculto tras el torso) ->
# zarpa solida con 3 deditos festoneados + pulgar conectado en el lado interno.
# (mismos paths que panda-neutral.svg)
ARM_L = ("M84 110Q66 105 59 120L58 149Q56.5 157 61 161Q63 162 64.5 160Q66 162 67.5 160"
         "Q69 162 70.5 160Q72.5 161.5 74.5 160.5Q76 161 76.5 159Q77.5 161 79.5 160"
         "Q82.5 159 82.5 156Q82.5 153 80 152.5Q78 152.5 77.5 155Q77 145 76 138L84 110Z")
ARM_R = ("M116 110Q134 105 141 120L142 149Q143.5 157 139 161Q137 162 135.5 160Q134 162 132.5 160"
         "Q131 162 129.5 160Q127.5 161.5 125.5 160.5Q124 161 123.5 159Q122.5 161 120.5 160"
         "Q117.5 159 117.5 156Q117.5 153 120 152.5Q122 152.5 122.5 155Q123 145 124 138L116 110Z")

# pivote ~ articulacion del hombro (junto al torso): el brazo abre desde ahi.
def arms(rot_l, rot_r):
    return (f'  <g fill="{BLACK}" stroke="{WHITE}" stroke-width="0.875" stroke-linejoin="round">\n'
            f'    <path d="{ARM_L}" transform="rotate({rot_l} 80 117)"/>\n'
            f'    <path d="{ARM_R}" transform="rotate({rot_r} 120 117)"/>\n'
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

# --- guion de la animacion (10 fotogramas) ---------------------------------
# Brazos simetricos: rot_l = +A (abre a la izquierda), rot_r = -A (a la derecha).
# A crece = los brazos/manos se ABREN hacia fuera y arriba.
# py negativo = mira hacia arriba (orgulloso); cabeza solo hace un bobeo (ty).
FRAMES = [
    # px, py, boca,    rot_l, rot_r, tx, ty, rot_h   fase
    (0,  0, "closed",    0,    0,   0,  0,  0),   # 0  reposo, brazos colgando
    (0,  1, "mid",      -7,    7,   0,  1,  0),   # 1  anticipa: brazos adentro, cabeza baja
    (0, -1, "open",      6,   -6,   0, -1,  0),   # 2  empieza a abrir, boca se abre
    (0, -1, "open",     16,  -16,   0, -1,  0),   # 3  abriendo
    (0, -2, "open",     26,  -26,   0, -2,  0),   # 4  abriendo mas
    (0, -2, "open",     34,  -34,   0, -2,  0),   # 5  BRAZOS ABIERTOS (revela / ta-da)
    (0, -2, "mid",      34,  -34,   0, -2,  0),   # 6  sostiene
    (0, -1, "open",     31,  -31,   0, -1,  0),   # 7  reasienta un poco, comenta
    (0, -1, "mid",      33,  -33,   0, -2,  0),   # 8  sostiene abierto
    (0,  0, "closed",   33,  -33,   0, -1,  0),   # 9  cierra el gesto, sigue abierto
]

def frame(i, px, py, mk, rl, rr, tx, ty, rh):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="Panda neutral abre los brazos - frame {i}">
  <title>Panda neutral - abre los brazos - frame {i}</title>
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

print("\nlisto - 10 fotogramas en", OUT)
