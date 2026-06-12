# Panda neutral · animación (abre los brazos)

Acción: el panda parte en reposo (brazos colgando) y **abre los brazos y las
manos hacia fuera**, simétrico, como quien se abre / presenta / da la
bienvenida, y sostiene la pose abierta mientras lo comenta.

Misma técnica que la animación vecina `../` ("te habla y te muestra algo").

## Ficheros
- `gen_frames.py` — genera `frame-00.svg` … `frame-09.svg` (fuente de la animación).
- `frame-00..09.svg` — los 10 fotogramas, planos y autocontenidos (sin `<use>`).
- `build_gif.py` — rasteriza los SVG y monta `panda-neutral-open.gif`.
- `panda-neutral-open.gif` — el GIF final (240 px, en bucle).
- `preview.html` — ábrelo en el navegador: GIF + reproductor vectorial en vivo
  + tira de fotogramas.

## Guion de los fotogramas
| # | qué hace |
|---|----------|
| 0 | reposo, brazos colgando |
| 1 | anticipación: encoge un poco los brazos y baja la cabeza |
| 2–4 | **abre los dos brazos/manos hacia fuera** |
| 5 | brazos del todo abiertos (revela / ta-da), mira arriba |
| 6–8 | sostiene la pose abierta y comenta |
| 9 | cierra el gesto sin bajar los brazos |

Los brazos giran desde el hombro (pivotes `80 117` / `120 117`); `rot_l` positivo
y `rot_r` negativo = se abren simétricos hacia fuera.

## Regenerar
```bash
python3 gen_frames.py            # reescribe los 10 SVG

# el GIF necesita un rasterizador SVG (cairosvg); puedes reutilizar el venv
# de la animación vecina:
../animated/.venv/bin/python build_gif.py
# …o crear uno propio:
python3 -m venv .venv && .venv/bin/pip install cairosvg pillow
.venv/bin/python build_gif.py    # reescribe panda-neutral-open.gif
```
Nota: ImageMagick (`convert`) no rasteriza bien estos fotogramas planos; usa
cairosvg (o el navegador, vía `preview.html`).
Ajusta tamaño y tiempos en las constantes `SIZE` / `DURATIONS_MS` de `build_gif.py`.
