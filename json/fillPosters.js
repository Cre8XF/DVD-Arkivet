const fs = require("fs");
const fetch = require("node-fetch");

// === KONFIG ===
const inputFile = "collection_part4.json";
const outputFile = "collection_part4_with_posters.json";
const tmdbApiKey = "db3d7987e3a39baedf6bc138afa46e74"; // v3 API Key
const delayMs = 300; // forsinkelse mellom forespørsler

// === Hjelpefunksjon: vent litt ===
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// === TMDb-forespørsel (v3 API Key)
async function fetchPoster(title, year) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}&year=${year}`;
  const res = await fetch(url);
  const data = await res.json();
  const posterPath = data?.results?.[0]?.poster_path;
  return posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : "";
}

// === Hovedfunksjon ===
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
  console.log(`✅ Ferdig! Lagret til ${outputFile}`);
}

run();
