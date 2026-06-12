# Pandas · emociones expresivas animadas (CSS)

Versión **animada** del set `../../expressive/` (el que adapta ojos, parches,
orejas y gesto a cada emoción). Misma técnica que `../emotions/`: **CSS
`@keyframes` autocontenido dentro de cada SVG** (vectorial, sin JS, sin GIF;
respeta `prefers-reduced-motion`).

La gracia aquí es que la animación va **encima de la pose estática** de cada
emoción, sin perderla:
- la **cabeza** se anima por CSS con keyframes que incluyen su transform base
  (equivalencia exacta CSS↔SVG del `translate()rotate()` sobre el cuello), así
  conserva su inclinación de gesto y sólo le añade un balanceo;
- **brazos** y **pies** van envueltos en grupos (`.arm-l/.arm-r`,
  `.foot-l/.foot-r`) y se mueven un poco sobre la pose ya levantada/caída;
- **ojos, boca, cuerpo**, coloreado (`.blush/.flush/.sadblush`) e **iconos**
  (`.extra`, lágrima/gota `.drip`) se animan según la emoción.

| emoción | vida añadida al gesto |
|---|---|
| celebrando | salta, agita los brazos en alto, estrellas que estallan |
| feliz | rebota, bracitos abiertos meneando, parpadeo, destellos |
| enamorado | suspira, ojos-corazón latiendo, corazones subiendo |
| guiño | ladea, saluda con el brazo, parpadeo + destello |
| sorprendido | respingo periódico, brazos arriba, boca-O, ❗ |
| pensativo | ladea lento, mira alrededor, burbujas de pensamiento |
| preocupado | tiembla, manos inquietas, gota que resbala |
| triste | suspiro lento, lágrima que cae, parpadeo triste |
| enfadado | tiembla rápido, mejillas rojas, vena que late |
| dormido | respiración profunda lenta, zZ flotando |

Ver: `index.html` (las 10 a la vez) o cada `panda-<emoción>.svg`.
Las animaciones CSS sólo corren en navegador (cairosvg/ImageMagick dan la pose base).
