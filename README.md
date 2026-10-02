# Ezequiel Management

Landing page estática de "Próximamente", hecha con HTML, CSS y JavaScript sin dependencias ni proceso de build.

## Estructura

```text
.
|-- index.html
|-- 404.html
|-- assets/
|   |-- img/
|   |   `-- favicon.svg
|   `-- poster.jpg
|-- css/
|   `-- styles.css
`-- js/
    |-- content-effects.js
    |-- paparazzi.js
    |-- script.js
    `-- video-stage.js
```

`404.html` es la página de error que GitHub Pages sirve para rutas inexistentes.

## Responsabilidades

- `index.html`: contenido semántico y punto de entrada del sitio.
- `404.html`: página personalizada para rutas inexistentes.
- `css/styles.css`: composición visual, capas, loader, animaciones y reglas responsive.
- `css/404.css`: estilos responsive de la página 404.
- `js/script.js`: inicialización, configuración compartida y coordinación de los efectos; inicia el contenido tras un breve fallback y mantiene el loader en ciclos completos hasta que el video está listo o falla.
- `js/video-stage.js`: reproducción, rotación y limpieza de los videos.
- `js/content-effects.js`: contador de progreso y texto tipo máquina de escribir.
- `js/paparazzi.js`: generación y limpieza de los flashes.
- `assets/img/favicon.svg`: icono del sitio.
- `assets/poster.jpg`: imagen de respaldo para los videos.

Los scripts se cargan con `defer` desde `index.html`. Conservá ese orden: los módulos de video, contenido y flashes registran sus APIs antes de que se ejecute el orquestador.

## Ejecución

Abrí `index.html` en un navegador. No hace falta instalar paquetes ni compilar. La tipografía y los videos se obtienen de Google Fonts y Pexels, por lo que esas partes requieren conexión a Internet.

Al publicar el sitio, mantené `index.html` en la raíz y conservá las carpetas `assets/`, `css/` y `js/` con sus nombres y rutas.