const fs = require("fs");
const fetch = require("node-fetch");

// === KONFIG ===
const inputFile = "missing_posters.json";
const outputFile = "missing_posters_with_posters.json";
const tmdbApiKey = process.env.TMDB_API_KEY;
const delayMs = 300;

if (!tmdbApiKey) {
  console.error("Missing TMDB_API_KEY environment variable. Run with: TMDB_API_KEY=your_key node fillPosters.js");
  process.exit(1);
}

// === Hjelpefunksjon ===
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// === TMDb-søk med fallback til 'tv'
async function fetchPoster(title, year) {
  const baseUrl = "https://api.themoviedb.org/3/search/";
  const imgBase = "https://image.tmdb.org/t/p/w500";

  for (const type of ["movie", "tv"]) {
    const url = `${baseUrl}${type}?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}&year=${year}`;
    const res = await fetch(url);
    const data = await res.json();
    const posterPath = data?.results?.[0]?.poster_path;
    if (posterPath) {
      console.log(`✅ FANT via ${type.toUpperCase()}: ${title}`);
      return imgBase + posterPath;
    }
  }

  console.log(`❌ Fant ikke: ${title}`);
  return "";
}

// === Hovedløp ===
async function run() {
  const data = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
  for (let i = 0; i < data.length; i++) {
    const movie = data[i];
    if (!movie.poster) {
      console.log(`🔍 ${i + 1}/${data.length}: ${movie.title} (${movie.year})`);
      try {
        const poster = await fetchPoster(movie.title, movie.year);
        movie.poster = poster;
      } catch (err) {
        console.warn(`⚠️ Feil for "${movie.title}": ${err.message}`);
        movie.poster = "";
      }
      await delay(delayMs);
    }
  }
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅ Lagret til ${outputFile}`);
}

run();
