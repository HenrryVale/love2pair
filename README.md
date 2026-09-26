# Love2Pair · Dual Phone 3D

Prototipo web para compartir una misma escena 3D entre dos celulares.

## Cómo funciona

- El **Celular A** crea una sala.
- El **Celular B** abre el mismo sitio y usa el código de 6 caracteres.
- PeerJS/WebRTC conecta ambos navegadores de forma P2P.
- Three.js renderiza una cámara virtual dividida en dos mitades usando `camera.setViewOffset()`.
- La posición de la esfera y los comandos se sincronizan en ambos sentidos.

## Probar localmente

Abre `index.html` en un servidor HTTP local. Para probar la conexión entre dos dispositivos, usa HTTPS o GitHub Pages.

## GitHub Pages

El sitio es estático: publica la rama `main` desde la raíz `/`.

URL esperada:

https://henrryvale.github.io/love2pair/

## Limitaciones del prototipo

- La unión visual funciona mejor con celulares de tamaño/orientación similares y colocados lado a lado.
- WebRTC puede fallar en redes con NAT/firewall muy restrictivo si no hay un servidor TURN.
- La versión inicial usa el servicio público de señalización de PeerJS.
