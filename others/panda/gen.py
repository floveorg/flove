#!/usr/bin/env python3
# Generador de los 11 pandas de flove.
# Base (cuerpo + cabeza + parches manga) idéntica en todos; solo cambia la cara.
# Capas con class="" para swap CSS trivial: .body .head .patches .eyes .brows .nose .mouth .blush .extra
import os

OUT = os.path.expanduser("~/Documents/flove/others/panda")
os.makedirs(OUT, exist_ok=True)

BLACK = "#2b2b2b"
WHITE = "#ffffff"
PINK  = "#ffb3c1"
MOUTH = "#8a4a4a"
TONG  = "#ff8fa3"
BLUE  = "#8fd3f4"
BLUEK = "#5bb4d6"
RED   = "#ff5a7a"
GOLD  = "#ffd23f"

# ---------- base común ----------
def base():
    return f'''  <!-- cuerpo (≈ mitad de la cabeza) -->
  <g class="body">
    <ellipse cx="100" cy="174" rx="40" ry="28" fill="{WHITE}" stroke="{BLACK}" stroke-width="3"/>
    <ellipse cx="66" cy="166" rx="12" ry="19" fill="{BLACK}" transform="rotate(22 66 166)"/>
    <ellipse cx="134" cy="166" rx="12" ry="19" fill="{BLACK}" transform="rotate(-22 134 166)"/>
    <ellipse cx="84" cy="194" rx="13" ry="9" fill="{BLACK}"/>
    <ellipse cx="116" cy="194" rx="13" ry="9" fill="{BLACK}"/>
  </g>
  <!-- cabeza (doble que el cuerpo) -->
  <g class="head">
    <circle cx="60" cy="46" r="21" fill="{BLACK}"/>
    <circle cx="140" cy="46" r="21" fill="{BLACK}"/>
    <circle cx="60" cy="46" r="10" fill="#5b4a4a"/>
    <circle cx="140" cy="46" r="10" fill="#5b4a4a"/>
    <circle cx="100" cy="92" r="60" fill="{WHITE}" stroke="{BLACK}" stroke-width="3"/>
  </g>
  <!-- parches manga: diagonal arriba y afuera -->
  <g class="patches" fill="{BLACK}">
    <ellipse cx="76" cy="86" rx="27" ry="16" transform="rotate(-34 76 86)"/>
    <ellipse cx="124" cy="86" rx="27" ry="16" transform="rotate(34 124 86)"/>
  </g>'''

def nose():
    return f'  <g class="nose"><ellipse cx="100" cy="110" rx="8" ry="5.5" fill="{BLACK}"/></g>'

# ---------- ojos ----------
# Todos los ojos van inclinados igual que el parche (anime): eje +34/-34,
# almendrados hacia arriba y al lado externo de la cara.
TILT_L = "rotate(-34 80 93)"
TILT_R = "rotate(34 120 93)"

def eyes_open(gx=0, gy=1, pr=6, rx=13, ry=9):
    return f'''  <g class="eyes">
    <ellipse cx="80" cy="93" rx="{rx}" ry="{ry}" fill="{WHITE}" transform="{TILT_L}"/>
    <ellipse cx="120" cy="93" rx="{rx}" ry="{ry}" fill="{WHITE}" transform="{TILT_R}"/>
    <circle cx="{80+gx}" cy="{93+gy}" r="{pr}" fill="{BLACK}"/>
    <circle cx="{120+gx}" cy="{93+gy}" r="{pr}" fill="{BLACK}"/>
    <circle cx="{80+gx-2}" cy="{93+gy-3}" r="2.3" fill="{WHITE}"/>
    <circle cx="{120+gx-2}" cy="{93+gy-3}" r="2.3" fill="{WHITE}"/>
  </g>'''

def eyes_arc_up():   # ^^ feliz (arcos inclinados)
    return f'''  <g class="eyes" fill="none" stroke="{BLACK}" stroke-width="4" stroke-linecap="round">
    <path d="M68 96 Q80 86 92 96" transform="{TILT_L}"/>
    <path d="M108 96 Q120 86 132 96" transform="{TILT_R}"/>
  </g>'''

def eyes_arc_down(): # dormido (arcos inclinados)
    return f'''  <g class="eyes" fill="none" stroke="{BLACK}" stroke-width="4" stroke-linecap="round">
    <path d="M68 92 Q80 100 92 92" transform="{TILT_L}"/>
    <path d="M108 92 Q120 100 132 92" transform="{TILT_R}"/>
  </g>'''

def eyes_narrow():   # enfadado (almendras finas e inclinadas)
    return f'''  <g class="eyes">
    <ellipse cx="80" cy="94" rx="12" ry="5.5" fill="{WHITE}" transform="{TILT_L}"/>
    <ellipse cx="120" cy="94" rx="12" ry="5.5" fill="{WHITE}" transform="{TILT_R}"/>
    <circle cx="80" cy="94" r="5" fill="{BLACK}"/>
    <circle cx="120" cy="94" r="5" fill="{BLACK}"/>
  </g>'''

def eyes_hearts():   # enamorado (corazones inclinados)
    return f'''  <g class="eyes">
    <g transform="{TILT_L}">{heart(80,91,1.7,RED)}</g>
    <g transform="{TILT_R}">{heart(120,91,1.7,RED)}</g>
  </g>'''

def eyes_stars():    # celebrando (almendras inclinadas + estrella)
    return f'''  <g class="eyes">
    <ellipse cx="80" cy="93" rx="13" ry="10" fill="{WHITE}" transform="{TILT_L}"/>
    <ellipse cx="120" cy="93" rx="13" ry="10" fill="{WHITE}" transform="{TILT_R}"/>
    <g transform="{TILT_L}">{star(80,93,0.8,GOLD)}</g>
    <g transform="{TILT_R}">{star(120,93,0.8,GOLD)}</g>
  </g>'''

def eyes_wink():     # guiño (ojo izdo abierto inclinado, dcho cerrado inclinado)
    return f'''  <g class="eyes">
    <ellipse cx="80" cy="93" rx="13" ry="9" fill="{WHITE}" transform="{TILT_L}"/>
    <circle cx="80" cy="93" r="6" fill="{BLACK}"/>
    <circle cx="78" cy="90" r="2.3" fill="{WHITE}"/>
    <path d="M108 95 Q120 87 132 95" fill="none" stroke="{BLACK}" stroke-width="4" stroke-linecap="round" transform="{TILT_R}"/>
  </g>'''

# ---------- cejas ----------
def brows(d_left, d_right):
    return f'''  <g class="brows" fill="none" stroke="{BLACK}" stroke-width="5" stroke-linecap="round">
    <path d="{d_left}"/>
    <path d="{d_right}"/>
  </g>'''

BROW_NEUTRAL = brows("M62 52 Q76 53 90 60", "M138 52 Q124 53 110 60")
BROW_SAD     = brows("M62 60 Q76 52 90 50", "M138 60 Q124 52 110 50")
BROW_ANGRY   = brows("M62 50 Q76 54 90 64", "M138 50 Q124 54 110 64")
BROW_UP      = brows("M62 50 Q76 42 92 50", "M138 50 Q124 42 108 50")
BROW_THINK   = brows("M62 54 Q76 55 90 60", "M138 46 Q124 42 110 50")

# ---------- bocas ----------
def mouth(inner):
    return f'  <g class="mouth">\n{inner}\n  </g>'

M_NEUTRAL = mouth(f'    <path d="M100 116 V121 M90 125 Q100 130 110 125" fill="none" stroke="{BLACK}" stroke-width="3" stroke-linecap="round"/>')
M_HAPPY   = mouth(f'    <path d="M100 116 V120" fill="none" stroke="{BLACK}" stroke-width="3" stroke-linecap="round"/>\n'
                  f'    <path d="M83 124 Q100 146 117 124 Q100 132 83 124 Z" fill="{MOUTH}"/>\n'
                  f'    <path d="M90 134 Q100 142 110 134 Q100 138 90 134 Z" fill="{TONG}"/>')
M_SAD     = mouth(f'    <path d="M100 116 V120 M88 130 Q100 122 112 130" fill="none" stroke="{BLACK}" stroke-width="3" stroke-linecap="round"/>')
M_ANGRY   = mouth(f'    <path d="M86 124 Q100 121 114 124 Q108 139 100 139 Q92 139 86 124 Z" fill="{MOUTH}"/>\n'
                  f'    <path d="M88 125 H112" stroke="{WHITE}" stroke-width="3"/>')
M_O       = mouth(f'    <ellipse cx="100" cy="127" rx="7" ry="9" fill="{MOUTH}"/>')
M_SMILE   = mouth(f'    <path d="M100 116 V120 M89 124 Q100 133 111 124" fill="none" stroke="{BLACK}" stroke-width="3" stroke-linecap="round"/>')
M_TINY    = mouth(f'    <path d="M95 126 Q100 130 105 126" fill="none" stroke="{BLACK}" stroke-width="3" stroke-linecap="round"/>')
M_SMIRK   = mouth(f'    <path d="M97 127 Q106 128 108 121" fill="none" stroke="{BLACK}" stroke-width="3" stroke-linecap="round"/>')
M_WORRY   = mouth(f'    <path d="M88 127 Q94 121 100 127 Q106 133 112 127" fill="none" stroke="{BLACK}" stroke-width="3" stroke-linecap="round"/>')
M_BIG     = mouth(f'    <path d="M80 122 Q100 153 120 122 Q100 132 80 122 Z" fill="{MOUTH}"/>\n'
                  f'    <path d="M90 134 Q100 144 110 134 Q100 139 90 134 Z" fill="{TONG}"/>')

# ---------- extras ----------
def heart(x, y, s, color):
    return (f'<path transform="translate({x} {y}) scale({s})" '
            f'd="M0 -2 C -1.6 -4.2 -5 -3 -5 -0.4 C -5 2.2 -1.6 3.6 0 5.6 '
            f'C 1.6 3.6 5 2.2 5 -0.4 C 5 -3 1.6 -4.2 0 -2 Z" fill="{color}"/>')

def star(x, y, s, color):
    return (f'<path transform="translate({x} {y}) scale({s})" '
            f'd="M0 -10 L2.9 -3.1 L9.5 -3.1 L4.3 1.2 L6.2 8 L0 4 '
            f'L-6.2 8 L-4.3 1.2 L-9.5 -3.1 L-2.9 -3.1 Z" fill="{color}"/>')

BLUSH = f'''  <g class="blush" fill="{PINK}" opacity="0.85">
    <ellipse cx="58" cy="108" rx="9" ry="5"/>
    <ellipse cx="142" cy="108" rx="9" ry="5"/>
  </g>'''

TEAR  = f'  <g class="extra"><path d="M132 100 q-5 9 0 13 q5 -4 0 -13 z" fill="{BLUE}" stroke="{BLUEK}" stroke-width="1"/></g>'
SWEAT = f'  <g class="extra"><path d="M150 56 q-5 9 0 13 q5 -4 0 -13 z" fill="{BLUE}" stroke="{BLUEK}" stroke-width="1"/></g>'
ZZZ   = (f'  <g class="extra" fill="{BLACK}" font-family="sans-serif" font-weight="bold">'
         f'<text x="150" y="42" font-size="13">z</text>'
         f'<text x="159" y="31" font-size="17">Z</text></g>')
THINK_X = (f'  <g class="extra" fill="{BLACK}"><circle cx="148" cy="42" r="2"/>'
           f'<circle cx="157" cy="34" r="3"/><circle cx="169" cy="24" r="4.5"/></g>')
HEARTS_FLY = (f'  <g class="extra">{heart(150,40,1.1,RED)}{heart(44,44,0.85,RED)}'
              f'{heart(160,70,0.7,RED)}</g>')
STARS_FLY = (f'  <g class="extra">{star(42,40,0.9,GOLD)}{star(160,38,1.1,GOLD)}'
             f'{star(168,78,0.7,GOLD)}{star(34,80,0.6,GOLD)}</g>')

# ---------- emociones ----------
EMOTIONS = {
    "neutral":     (eyes_open(),                       BROW_NEUTRAL, M_NEUTRAL, ""),
    "feliz":       (eyes_arc_up(),                     BROW_NEUTRAL, M_HAPPY,   BLUSH),
    "triste":      (eyes_open(gy=5),                   BROW_SAD,     M_SAD,     TEAR),
    "enfadado":    (eyes_narrow(),                     BROW_ANGRY,   M_ANGRY,   ""),
    "sorprendido": (eyes_open(pr=5, rx=14, ry=11),     BROW_UP,      M_O,       ""),
    "enamorado":   (eyes_hearts(),                     BROW_UP,      M_SMILE,   BLUSH + "\n" + HEARTS_FLY),
    "dormido":     (eyes_arc_down(),                   BROW_NEUTRAL, M_TINY,    ZZZ),
    "pensativo":   (eyes_open(gx=3, gy=-4),            BROW_THINK,   M_SMIRK,   THINK_X),
    "guino":       (eyes_wink(),                       BROW_NEUTRAL, M_SMILE,   BLUSH),
    "preocupado":  (eyes_open(gy=-1, pr=5, rx=11, ry=8), BROW_SAD,   M_WORRY,   SWEAT),
    "celebrando":  (eyes_stars(),                      BROW_UP,      M_BIG,     STARS_FLY),
}

ORDER = ["neutral","feliz","triste","enfadado","sorprendido","enamorado",
         "dormido","pensativo","guino","preocupado","celebrando"]

def build(name, eyes, brow, mth, extra):
    extra_block = ("\n" + extra) if extra else ""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="Panda {name}">
  <title>Panda {name}</title>
  <g class="panda" data-emotion="{name}">
{base()}
{eyes}
{brow}
{nose()}
{mth}{extra_block}
  </g>
</svg>
'''

for name in ORDER:
    eyes, brow, mth, extra = EMOTIONS[name]
    svg = build(name, eyes, brow, mth, extra)
    with open(os.path.join(OUT, f"panda-{name}.svg"), "w") as f:
        f.write(svg)
    print("escrito", f"panda-{name}.svg")

# ---------- showcase ----------
cards = "\n".join(
    f'    <figure><img src="panda-{n}.svg" width="160" height="160" alt="Panda {n}"><figcaption>{n}</figcaption></figure>'
    for n in ORDER)
html = f'''<!doctype html>
<html lang="es">
<meta charset="utf-8">
<title>Pandas flove · 11 emociones</title>
<style>
  body {{ margin:0; font-family:system-ui,sans-serif; background:#fafafa; color:#2b2b2b; }}
  h1 {{ text-align:center; font-weight:600; padding:24px 0 4px; }}
  p.sub {{ text-align:center; margin:0 0 24px; color:#888; }}
  .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
          gap:16px; max-width:1100px; margin:0 auto 48px; padding:0 16px; }}
  figure {{ margin:0; background:#fff; border:1px solid #eee; border-radius:14px;
           padding:14px; text-align:center; transition:transform .15s, box-shadow .15s; }}
  figure:hover {{ transform:translateY(-4px); box-shadow:0 8px 24px rgba(0,0,0,.08); }}
  figcaption {{ margin-top:8px; font-size:14px; color:#555; text-transform:capitalize; }}
</style>
<h1>Pandas flove</h1>
<p class="sub">11 emociones · misma base, cara intercambiable</p>
<div class="grid">
{cards}
</div>
</html>
'''
with open(os.path.join(OUT, "pandas-index.html"), "w") as f:
    f.write(html)
print("escrito pandas-index.html")
