# Pandas · emociones animadas (CSS)

Copias animadas de las caras de emoción (`others/panda/panda-<emoción>.svg`).
Los estáticos originales **no se tocan**; estos son la versión "viva".

A diferencia del panda neutral (que se animó con fotogramas → GIF en `../`),
estas caras ya venían con estructura por clases (`.head`, `.eyes`, `.mouth`,
`.body`, `.brows`, `.blush`, `.extra`…), así que se animan con **CSS
`@keyframes` autocontenido dentro del propio SVG**: vectorial, sin JS, sin GIF,
sin paso de build. Encaja con la distro CSS-pura de flove.

## Qué se mueve
Cada cara anima **cabeza, ojos, manos, pies, boca y cuerpo** según su emoción,
más:
- **coloreado progresivo de la cara** — rubor (enamorado/guiño/feliz), rojo de
  enfado (enfadado), azulado de tristeza (triste).
- **iconos alrededor** — corazones (enamorado), estrellas/destellos
  (celebrando/feliz), zZ (dormido), vena de enfado (enfadado), destello de
  guiño, puntos de pensamiento (pensativo), gota de sudor (preocupado),
  ❗ (sorprendido), lágrima que cae (triste).

| emoción | carácter del movimiento |
|---|---|
| enamorado | vaivén soñador, ojos-corazón latiendo, corazones subiendo |
| feliz | rebote alegre, bracitos meneando, risa, destellos |
| celebrando | salta y ondea los brazos, estrellas que estallan |
| guiño | ladea la cabeza, saluda, parpadeo + destello |
| sorprendido | respingo, brazos arriba, boca-O, ❗ |
| pensativo | ladea y mira alrededor, burbujas de pensamiento |
| preocupado | inquieto, mirada nerviosa, gota de sudor que resbala |
| triste | cabeza gacha, suspiro, lágrima que cae |
| enfadado | tiembla, puños, mejillas rojas, vena |
| dormido | respiración lenta y profunda, zZ flotando |

## Estructura de cada SVG
- `<style><![CDATA[ … ]]></style>` con los `@keyframes` y la asignación por clase.
- El cuerpo se reestructura mínimamente para poder animar partes sueltas:
  brazos/pies envueltos en grupos (`.arm-l/.arm-r`, `.foot-l/.foot-r`), iconos
  flotantes envueltos para moverlos por separado.
- Pivotes con `transform-box: view-box; transform-origin: <x>px <y>px` (giro de
  hombro, cuello…) o `fill-box; center` (latidos, parpadeos).

## Ver
Abre `index.html` en el navegador (galería con las 10 a la vez), o cada
`panda-<emoción>.svg` directamente — la animación va dentro del propio fichero.

> Nota: las animaciones CSS dentro de SVG sólo corren en navegador; cairosvg /
> ImageMagick rasterizan el fotograma base (pose en reposo).
