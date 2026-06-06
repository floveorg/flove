# ✺ XR-kit — snippets (copy-paste recipes)

Building blocks for designing VR requests fast. Drop into a scene based on
`templates/starter.html`. Always serve over `http://localhost`.

## Scripts to include (offline, from ../lib)
```html
<script src="../lib/aframe.min.js"></script>
<script src="../lib/troika-text.js"></script>          <!-- crisp 3D text from .ttf -->
<script src="../lib/aframe-environment.min.js"></script><!-- instant scenery -->
<script src="../lib/aframe-layout.min.js"></script>     <!-- auto-place children -->
<script src="../lib/aframe-extras.min.js"></script>     <!-- movement, animation-mixer -->
```

## Crisp text (troika — no MSDF, updatable)
```html
<a-troika-text value="hello" font="../fonts/Inter.ttf" font-size="0.14"
               color="#fff" anchor="center" align="center" max-width="2.5"></a-troika-text>
```
```js
el.setAttribute('troika-text','value', 'new text');   // runtime update
```

## Clickable button (works with mouse + gaze + laser)
```html
<a-entity class="clickable" data-act="save" hover-glow="">
  <a-sphere radius="0.16" material="emissive:#8d89ff; emissiveIntensity:.7; color:#8d89ff"></a-sphere>
  <a-troika-text value="Save" font="../fonts/Inter.ttf" font-size="0.1" anchor="center" position="0 -0.3 0"></a-troika-text>
</a-entity>
```
```js
// route clicks centrally (on the scene)
sceneEl.addEventListener('click', e => {
  const act = e.target.getAttribute && e.target.getAttribute('data-act');
  if(act==='save') saveJSON();
});
```

## Auto-layout — stop hand-computing coordinates
```html
<a-entity layout="type: circle; radius: 2.4" position="0 1.6 0"> …children… </a-entity>
<a-entity layout="type: grid; columns: 3; margin: 0.9"> …children… </a-entity>
<!-- types: line | circle | grid | cube | dodecahedron | pyramid -->
```

## Instant scenery (one attribute)
```html
<a-entity environment="preset: dream; ground: hills; fog: 0.7; dressing: cubes"></a-entity>
<!-- presets: forest japan tron dream arches starry egypt goldmine volcano ... -->
```

## Scaled input rig (mouse → laser → hands → gaze)
```html
<a-entity>
  <a-camera><a-cursor raycaster="objects: .clickable" fuse="true" fuse-timeout="650"></a-cursor></a-camera>
  <a-entity laser-controls="hand: right" raycaster="objects: .clickable; far: 30" line="color:#8d89ff"></a-entity>
  <a-entity laser-controls="hand: left"  raycaster="objects: .clickable; far: 30" line="color:#70f0d3"></a-entity>
  <a-entity hand-tracking-controls="hand: right"></a-entity>
  <a-entity hand-tracking-controls="hand: left"></a-entity>
</a-entity>
<!-- scene attr for desktop mouse: cursor="rayOrigin: mouse" raycaster="objects: .clickable" -->
```

## Visual editor (offline)
```html
<a-scene inspector="url: ../lib/aframe-inspector.min.js"> … </a-scene>
```
Press **Ctrl+Alt+I** → move/rotate entities, read the gizmo values, paste back.

## Existing HTML panel → 3D (htmlmesh, version-sensitive)
See `templates/htmlmesh-panel.html`. Needs the vendored `lib/three` + importmap.

## Export interaction as JSON (the INTERFACES.md line)
```js
function saveJSON(data){
  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = "play.json";
  document.body.appendChild(a); a.click(); a.remove();
}
```
