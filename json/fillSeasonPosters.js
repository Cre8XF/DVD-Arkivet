const fs = require("fs");
const fetch = require("node-fetch");

const inputFile = "season_posters_candidates.json";
const outputFile = "season_posters_with_posters.json";
const tmdbApiKey = process.env.TMDB_API_KEY;
const delayMs = 300;

if (!tmdbApiKey) {
  console.error("Missing TMDB_API_KEY environment variable. Run with: TMDB_API_KEY=your_key node fillSeasonPosters.js");
  process.exit(1);
}

// === Ekstraher sesongnummer og rens tittel
function extractSeasonData(title) {
  const seasonMatch = title.match(/season\s*(\d+)/i) || title.match(/s(\d{1,2})/i);
  const season = seasonMatch ? parseInt(seasonMatch[1]) : null;
  const baseTitle = title
    .replace(/[:\-]?\s*Season\s*\d+/i, "")
    .replace(/\s*S\d{1,2}/i, "")
    .trim();
  return { baseTitle, season };
}

// === Hent TV-ID fra serie
async function getTvId(seriesName) {
  const url = `https://api.themoviedb.org/3/search/tv?api_key=${tmdbApiKey}&query=${encodeURIComponent(seriesName)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data?.results?.[0]?.id || null;
}

// === Hent sesongposter
async function getSeasonPoster(tvId, seasonNumber) {
  const url = `https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${tmdbApiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  return data?.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : "";
}

// === Hovedløp
async function run() {
  const data = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
  for (let i = 0; i < data.length; i++) {
    const movie = data[i];
    const { baseTitle, season } = extractSeasonData(movie.title || "");
    if (!baseTitle || !season) {
      console.log(`⚠️ Skipped (kunne ikke tolke): ${movie.title}`);
      continue;
    }

    console.log(`🔍 ${i + 1}/${data.length}: ${baseTitle} – Season ${season}`);
    try {
      const tvId = await getTvId(baseTitle);
      if (!tvId) {
        console.warn(`❌ Fant ikke TV-serie: ${baseTitle}`);
        continue;
      }

      const poster = await getSeasonPoster(tvId, season);
      if (poster) {
        movie.poster = poster;
        console.log(`✅ Hentet poster`);
      } else {
        console.warn(`❌ Ingen poster for sesong ${season}`);
      }
    } catch (err) {
      console.error(`⚠️ Feil for ${movie.title}: ${err.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), "utf-8");
  console.log(`🎉 Lagret til ${outputFile}`);
}

run();
