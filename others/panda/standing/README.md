# Pandas · emociones con cuerpo neutral (de pie)

Rediseño **estático** de las caras de emoción sobre la base del **panda
neutral** (`../panda-neutral.svg`), pedido por Marc:

1. **Cuerpo como el neutral** — de pie, con piernas, botines y bracitos-zarpa
   colgando; ya no el cuerpo redondo "sentado" de las versiones anteriores.
2. **Parches del ojo con inclinación tipo neutral** — la hoja del neutral
   (vertical, abrazando el ojo) en vez del parche elíptico muy diagonal.

Cada panda comparte exactamente la misma base (cuerpo + cabeza + parches del
neutral) y sólo cambia la **cara** (ojos, boca, color) y los **iconos**:

| emoción | cara + icono |
|---|---|
| enamorado | ojos-corazón, rubor, corazones flotando |
| feliz | ojos `^^`, sonrisa abierta con lengua, rubor, destellos |
| celebrando | ojos-estrella, risa, estrellas alrededor |
| guiño | un ojo abierto + un guiño, rubor, destello |
| sorprendido | ojos muy abiertos, boca-O, ❗ |
| pensativo | mirada arriba, mueca, burbujas de pensamiento |
| preocupado | ojos chicos, boca ondulada, gota de sudor |
| triste | pupilas bajas, ceño caído, mejillas azuladas, lágrima |
| enfadado | ojos rasgados, mejillas rojas, mueca con dientes, vena |
| dormido | ojos cerrados, zZ |

Como los parches del neutral son negros y cubren la zona del ojo, los ojos se
dibujan en **blanco** (esclerótica) + pupila oscura para que se vean sobre el
parche (igual que en el neutral).

Ver: abre `index.html` (las 10 a la vez) o cada `panda-<emoción>.svg`.

> Nota: estos son los **estáticos** nuevos. Las versiones **animadas** en
> `../animated/emotions/` siguen sobre el cuerpo redondo anterior; si quieres,
> se pueden rebasar a esta misma base de pie.
