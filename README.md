# Ezequiel Management

Static "Coming Soon" landing page built with HTML, CSS, and JavaScript, with no dependencies or build process.

## Structure

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

`404.html` is the error page GitHub Pages serves for non-existent routes.

## Responsibilities

- `index.html`: semantic content and the site entry point.
- `404.html`: custom page for non-existent routes.
- `css/styles.css`: visual layout, layers, loader, animations, and responsive rules.
- `css/404.css`: responsive styles for the 404 page, using the landing page's poster background, color palette, and typography.
- `js/script.js`: initialization, shared configuration, and effects coordination; starts the content after a short fallback and dismisses the loader even if the video does not finish loading.
- `js/video-stage.js`: video playback, rotation, and cleanup.
- `js/content-effects.js`: progress counter and typewriter text effects.
- `js/paparazzi.js`: flash generation and cleanup.
- `assets/img/favicon.svg`: site icon.
- `assets/poster.jpg`: video fallback image.

Scripts are loaded with `defer` from `index.html`. Preserve their order: the video, content, and flash modules register their APIs before the orchestrator runs.

## Running the site

Open `index.html` in a browser. No packages or build steps are required. Fonts are loaded from Google Fonts without blocking the initial page load; fallback fonts are used when offline. Videos are hosted on Pexels and require an internet connection.

When publishing the site, keep `index.html` in the root and preserve the `assets/`, `css/`, and `js/` directories with their existing names and paths.