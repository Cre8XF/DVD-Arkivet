# DVD-Arkivet (Film Arkivet)

A browser-based DVD and movie collection manager. Browse, filter, search, and manage a personal disc library with poster art, metadata, and multiple visual themes.

## Features

- Grid display of movie posters with detail modal
- Filter by genre, year, and format
- Full-text search across title, actors, director, and overview
- Sort by title, year, IMDb rating, runtime, or date added
- 8 visual themes (Neon, Sunset, Frost, Cyberpunk, Aurora, Bloodmoon, Void, default)
- Responsive design with mobile filter drawer
- Import/export collection as JSON
- JSON/CSV converter
- TMDb integration for fetching poster art and metadata
- Firebase Firestore integration for cloud storage (import tools)

## Tech Stack

- HTML5, CSS3, vanilla JavaScript (ES6 modules)
- No build system required -- serve as static files
- Node.js scripts for batch poster fetching (optional)

## Getting Started

1. Serve the project root with any static file server:
   ```
   npx serve .
   ```
2. Open `index.html` in a browser.
3. The collection loads from `json/collection.json`.

## Import Tools

The `dvd_import/` directory contains standalone HTML pages for importing movies:

- **import.html** -- Search TMDb, enrich metadata, and save to Firebase
- **manual_import_clz_only.html** -- Import from CLZ-format JSON directly to Firebase
- **hent_tmdb_bilder.html** -- Batch-fetch poster images from TMDb

These tools require a `dvd_import/config.js` file with your API keys. Copy from the template:

```
cp dvd_import/config.example.js dvd_import/config.js
```

Then fill in your Firebase and TMDb credentials.

## Batch Poster Scripts

The Node.js scripts in `json/` fetch missing posters from TMDb:

```
cd json
npm install
TMDB_API_KEY=your_key node fillPosters.js
TMDB_API_KEY=your_key node fillSeasonPosters.js
```

## Movie JSON Schema

Each movie in `collection.json` follows this structure:

| Field       | Type   | Example                        |
|-------------|--------|--------------------------------|
| title       | string | "12 Monkeys"                   |
| year        | string | "1995"                         |
| genres      | string | "Science Fiction \| Drama"     |
| runtime     | string | "2:09"                         |
| director    | string | "Terry Gilliam"                |
| actors      | string | "Bruce Willis \| Brad Pitt"    |
| format      | string | "DVD"                          |
| overview    | string | "Description text..."          |
| imdbRating  | string | "8.0"                          |
| imdbUrl     | string | "https://www.imdb.com/..."     |
| poster      | string | URL or base64 data             |
| barcode     | string | "7332431022836"                |

## Project Structure

```
DVD-Arkivet/
  index.html              Main application
  converter.html          JSON/CSV converter
  css/
    styles.css            Themes and layout
    responsive.css        Responsive breakpoints
    converter.css         Converter page styles
  js/
    app.js                Core application logic
    edit.js               Movie editing functionality
    converter.js          CSV/JSON converter logic
  json/
    collection.json       Movie collection data
    manifest.json         PWA manifest
    fillPosters.js        Batch poster fetcher (Node.js)
    fillSeasonPosters.js  Season poster fetcher (Node.js)
    json_to_csv.py        JSON-to-CSV converter (Python)
  dvd_import/
    import.html           TMDb + Firebase importer
    import.js             Import logic (ES module)
    manual_import_clz_only.html  Manual CLZ importer
    manual_import.js      Manual import logic (ES module)
    hent_tmdb_bilder.html Batch poster fetcher (browser)
    hent_tmdb_bilder.js   Poster fetcher logic
    import-tools.css      Shared styles for import tools
    config.example.js     API key template
  images/                 Local poster images and icons
```
