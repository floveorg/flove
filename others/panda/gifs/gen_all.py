#!/usr/bin/env python3
# Crea un GIF animado por emocion (como el del neutral): hornea la animacion
# expresiva en N fotogramas planos y los rasteriza con cairosvg.
# Fuente de cada pose: ../expressive/panda-<emo>.svg  (se le inyectan transforms
# por fotograma sobre la pose de gesto).
# Uso:  ../animated/.venv/bin/python gen_all.py
import math, os, re, io
import cairosvg
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC  = os.path.join(HERE, '..', 'expressive')
N    = 12          # fotogramas
SIZE = 240         # px del gif

def u(t, c=1):  return 0.5 - 0.5*math.cos(2*math.pi*c*t)      # rampa suave 0->1->0
def s(t, c=1, ph=0): return math.sin(2*math.pi*c*t + ph)      # seno
def ramp(t, a=0.25, b=0.75):                                  # 0 en extremos, 1 en medio
    if t < a:  return t/a
    if t > b:  return (1-t)/(1-b)
    return 1.0

# ---- motion: devuelve los deltas por fotograma para cada emocion -------------
def motion(emo, t):
    d = dict(hrot=0,hty=0, aL=0,aR=0, foot=0, body=1.0,
             edx=0,esx=1.0,esy=1.0, mdx=0,msy=1.0,
             ex_dx=0,ex_dy=0,ex_sc=1.0,ex_op=1.0,
             dr_dy=0,dr_op=1.0, col=None, ms=120)
    if emo=='celebrando':
        d.update(ms=70, hrot=4*s(t,1), hty=-3*u(t,1), aL=7*s(t,2), aR=-7*s(t,2),
                 foot=-2*u(t,2), body=1+0.05*u(t,1), esx=1+0.1*u(t,2), esy=1+0.1*u(t,2),
                 msy=0.85+0.25*u(t,2), ex_sc=0.9+0.25*u(t,2), ex_op=0.6+0.4*u(t,2))
    elif emo=='feliz':
        d.update(ms=90, hrot=2*s(t,1), hty=-2*u(t,1), aL=6*s(t,2), aR=-6*s(t,2),
                 foot=-2*u(t,2), body=1+0.05*u(t,1),
                 ex_sc=0.85+0.3*u(t,2), ex_op=0.5+0.5*u(t,2), col=('blush',0.6+0.35*u(t,1)))
    elif emo=='enamorado':
        d.update(ms=230, hrot=2*s(t,1), aL=2*s(t,1), aR=-2*s(t,1), foot=-1*u(t,1),
                 body=1+0.03*u(t,1), esx=1+0.16*u(t,2), esy=1+0.16*u(t,2),
                 ex_dy=-28*t, ex_op=ramp(t), col=('blush',0.5+0.45*u(t,1)))
    elif emo=='guino':
        d.update(ms=250, hrot=3*s(t,1), aL=9*s(t,2), aR=-2*s(t,1), body=1+0.03*u(t,1),
                 ex_sc=0.3+0.9*u(t,2), ex_op=u(t,2),
                 col=('blush',0.55+0.4*u(t,1)))
    elif emo=='sorprendido':
        j = math.exp(-((t-0.18)/0.12)**2)
        d.update(ms=120, hrot=-3*j, hty=-5*j, aL=-10*j, aR=10*j, foot=-3*j,
                 body=1+0.05*j, esx=1+0.2*j, esy=1+0.2*j, msy=1+0.3*j,
                 ex_sc=0.2+1.0*j, ex_op=min(1.0,1.4*j))
    elif emo=='pensativo':
        d.update(ms=370, hrot=2*u(t,1), aL=2*u(t,1), body=1+0.02*u(t,1),
                 edx=2*s(t,1), msy=1+0.05*u(t,1), ex_sc=0.85+0.3*u(t,2), ex_op=0.4+0.6*u(t,2))
    elif emo=='preocupado':
        d.update(ms=150, hrot=2*s(t,1), aL=3*s(t,2), aR=-3*s(t,2), body=1+0.03*u(t,1),
                 edx=2*s(t,1), mdx=1.2*s(t,1), dr_dy=14*t, dr_op=ramp(t,0.2,0.8))
    elif emo=='triste':
        bl = 0.15 if 0.42<=t<0.5 else 1.0
        d.update(ms=260, hrot=1*s(t,1), hty=2*u(t,1), aL=3*s(t,1), aR=-3*s(t,1),
                 esy=bl, mdx=0.6*s(t,4), dr_dy=32*t, dr_op=ramp(t,0.15,0.78),
                 col=('sadblush',0.3+0.3*u(t,1)))
    elif emo=='enfadado':
        d.update(ms=80, hrot=2*s(t,3), aL=4*s(t,3), aR=-4*s(t,3), body=1+0.03*u(t,1),
                 col=('flush',0.35+0.45*u(t,1)))
    elif emo=='dormido':
        d.update(ms=240, hrot=1*s(t,1), hty=1*u(t,1), body=1+0.05*u(t,1),
                 ex_dx=12*t, ex_dy=-24*t, ex_op=ramp(t))
    return d

def frame_svg(static, emo, t):
    m = motion(emo, t)
    svg = static
    # cabeza (prepende rotate+translate sobre el transform base)
    svg = svg.replace('<g class="head" transform="',
        f'<g class="head" transform="rotate({m["hrot"]:.2f} 100 102) translate(0 {m["hty"]:.2f}) ', 1)
    # brazos (2): prepende rotate sobre el hombro
    cnt = {'i':0}
    def arm(mt):
        i = cnt['i']; cnt['i'] += 1
        piv = '80 118' if i==0 else '120 118'
        dd  = m['aL'] if i==0 else m['aR']
        return f'<g transform="rotate({dd:.2f} {piv}) {mt.group(1)}"><use href="#arm"/>'
    svg = re.sub(r'<g transform="([^"]*)"><use href="#arm"/>', arm, svg)
    # pies (2): prepende translateY
    svg = re.sub(r'<use href="#foot" transform="',
        f'<use href="#foot" transform="translate(0 {m["foot"]:.2f}) ', svg)
    # cuerpo
    svg = svg.replace('<ellipse class="body"',
        f'<ellipse transform="translate(100 126) scale(1 {m["body"]:.3f}) translate(-100 -126)" class="body"', 1)
    # ojos
    svg = svg.replace('<g class="eyes"',
        f'<g transform="translate({m["edx"]:.2f} 0) translate(100 55) scale({m["esx"]:.3f} {m["esy"]:.3f}) translate(-100 -55)" class="eyes"', 1)
    # boca
    svg = svg.replace('<g class="mouth"',
        f'<g transform="translate({m["mdx"]:.2f} 0) translate(100 80) scale(1 {m["msy"]:.3f}) translate(-100 -80)" class="mouth"', 1)
    # iconos (extra)
    if '<g class="extra"' in svg:
        svg = svg.replace('<g class="extra"',
            f'<g transform="translate({m["ex_dx"]:.2f} {m["ex_dy"]:.2f}) translate(100 40) scale({m["ex_sc"]:.3f}) translate(-100 -40)" opacity="{m["ex_op"]:.2f}" class="extra"', 1)
    # lagrima / gota
    svg = re.sub(r'<use href="#(tear|drop)" transform="',
        lambda mt: f'<use opacity="{m["dr_op"]:.2f}" href="#{mt.group(1)}" transform="translate(0 {m["dr_dy"]:.2f}) ', svg)
    # color de cara
    if m['col']:
        cls, op = m['col']
        svg = re.sub(rf'(<g class="{cls}"[^>]*opacity=")[0-9.]+(")', rf'\g<1>{op:.2f}\2', svg, count=1)
    return svg

EMOS = ['enamorado','feliz','celebrando','guino','sorprendido',
        'pensativo','preocupado','triste','enfadado','dormido']

for emo in EMOS:
    static = open(os.path.join(SRC, f'panda-{emo}.svg')).read()
    folder = os.path.join(HERE, emo)
    os.makedirs(folder, exist_ok=True)
    imgs, ms = [], motion(emo, 0)['ms']
    for i in range(N):
        t = i / N
        fsvg = frame_svg(static, emo, t)
        open(os.path.join(folder, f'frame-{i:02d}.svg'), 'w').write(fsvg)
        png = cairosvg.svg2png(bytestring=fsvg.encode(), output_width=SIZE,
                               output_height=SIZE, background_color='white')
        imgs.append(Image.open(io.BytesIO(png)).convert('RGB'))
    gif = os.path.join(folder, f'panda-{emo}.gif')
    imgs[0].save(gif, save_all=True, append_images=imgs[1:], duration=ms,
                 loop=0, disposal=2, optimize=True)
    print(f'{emo}: {N} fotogramas + {os.path.basename(gif)} ({ms}ms/f)')
print('listo')
