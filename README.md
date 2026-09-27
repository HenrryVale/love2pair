# Love2Pair · Dual Phone 3D

Prototipo web para compartir una misma escena 3D entre dos celulares.

## Emparejamiento por proximidad

La versión actual incluye una prueba de detección acústica:

1. Abre la web en ambos celulares.
2. Pulsa **Activar detección automática** en ambos y concede permiso de micrófono.
3. Mantén las dos páginas visibles, sin audífonos y con el volumen multimedia alrededor de 60%.
4. Acerca los teléfonos aproximadamente a 5–30 cm.
5. Cada navegador emite de forma intermitente un barrido de alta frecuencia de aproximadamente 16.2–18.4 kHz.
6. Al detectar el barrido del otro teléfono, ambos intentan automáticamente el mismo rendezvous de PeerJS. Uno queda como mitad izquierda y el otro como mitad derecha.
7. Después del emparejamiento, el audio/micrófono de proximidad se detiene y la escena continúa por WebRTC P2P.

No hace falta introducir el código de sala cuando este método funciona.

> Limitación: esto es detección acústica experimental, no una medición física de distancia. Algunos teléfonos filtran las frecuencias altas o aplican procesamiento de audio que impide detectar la señal.

## Emparejamiento manual

El método anterior sigue disponible como respaldo:

- El **Celular A** crea una sala.
- El **Celular B** abre el mismo sitio y usa el código de 6 caracteres.
- PeerJS/WebRTC conecta ambos navegadores de forma P2P.

## Escena 3D

- Three.js renderiza una cámara virtual dividida en dos mitades usando `camera.setViewOffset()`.
- La posición de la esfera y los comandos se sincronizan en ambos sentidos.
- La esfera puede cruzar visualmente del borde de un teléfono al otro.

## Probar

Sitio:

https://henrryvale.github.io/love2pair/

La detección por micrófono requiere HTTPS, por lo que GitHub Pages es el entorno recomendado para probar desde celulares.

## Limitaciones del prototipo

- Los navegadores exigen una acción del usuario para autorizar el micrófono; por eso hay que pulsar **Activar detección automática** al menos al iniciar la prueba.
- La unión visual funciona mejor con celulares de tamaño/orientación similares y colocados lado a lado.
- El detector acústico funciona mejor sin audífonos y con los teléfonos relativamente cerca.
- Algunos parlantes o micrófonos móviles filtran 16–18 kHz.
- WebRTC puede fallar en redes con NAT/firewall muy restrictivo si no hay un servidor TURN.
- La versión actual usa el servicio público de señalización de PeerJS.
- El rendezvous automático está pensado como prototipo; para un producto multiusuario convendría sustituirlo por intercambio acústico de un identificador o un servicio de presencia dedicado.
