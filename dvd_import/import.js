import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { firebaseConfig, tmdbApiKey } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let existingIds = new Set();
let newMovies = [];

async function getExistingMovieIds() {
  const snapshot = await getDocs(collection(db, "movies"));
  snapshot.forEach(doc => existingIds.add(doc.id));
}

window.loadAndSearch = async function () {
  await getExistingMovieIds();

  const file = document.getElementById('fileInput').files[0];
  if (!file) return alert("Velg en fil først.");
  const text = await file.text();

  let raw = JSON.parse(text);
  let importedMovies = Array.isArray(raw) && raw[0]?.["Title"]
    ? raw.map(item => ({
        title: item["Title"] || "",
        year: String(item["Release Date"] || ""),
        genres: item["Genres"] || "",
        runtime: item["Runtime"] || "",
        director: item["Director"] || "",
        poster: "",
        overview: "",
        added: item["Added Date"] || new Date().toISOString().split("T")[0]
      }))
    : raw;

  const container = document.getElementById("movieList");
  container.innerHTML = "";
  newMovies = [];
  let notFoundTitles = [];

  for (let movie of importedMovies) {
    try {
      const searchRes = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(movie.title)}&year=${movie.year}&api_key=${tmdbApiKey}`);
      const searchData = await searchRes.json();
      const result = searchData.results?.find(r => r.title.toLowerCase() === movie.title.toLowerCase());
      if (!result) {
        console.warn(`❌ Ingen TMDb-treff for: "${movie.title}"`);
        notFoundTitles.push(movie.title);
        continue;
      }

      const detailsRes = await fetch(`https://api.themoviedb.org/3/movie/${result.id}?api_key=${tmdbApiKey}&append_to_response=credits`);
      const details = await detailsRes.json();

      const fullMovie = {
        id: String(result.id),
        title: details.title,
        overview: details.overview || "",
        year: details.release_date ? details.release_date.split("-")[0] : "",
        genres: details.genres.map(g => g.name).join(" | "),
        director: details.credits.crew.find(p => p.job === "Director")?.name || "",
        actors: details.credits.cast.slice(0, 5).map(a => a.name).join(" | "),
        runtime: details.runtime ? `${Math.floor(details.runtime / 60)}:${String(details.runtime % 60).padStart(2, '0')}` : "",
        poster: details.poster_path ? "https://image.tmdb.org/t/p/w300" + details.poster_path : "",
        imdbRating: result.vote_average ? result.vote_average.toFixed(1) : "",
        added: movie.added || new Date().toISOString().split("T")[0]
      };

      const exists = existingIds.has(fullMovie.id);
      if (!exists) newMovies.push(fullMovie);

      const div = document.createElement("div");
      div.className = "movie-card";
      div.innerHTML = `
        <h3>${fullMovie.title} (${fullMovie.year})</h3>
        ${fullMovie.poster ? `<img src="${fullMovie.poster}" alt="Poster">` : "<p>❌ Ingen plakat</p>"}
        <p><strong>⭐ IMDb:</strong> ${fullMovie.imdbRating || "Ukjent"}</p>
        <p><strong>Sjanger:</strong> ${fullMovie.genres}</p>
        <p><strong>Regissør:</strong> ${fullMovie.director}</p>
        <p><strong>Skuespillere:</strong> ${fullMovie.actors}</p>
        <p><strong>Spilletid:</strong> ${fullMovie.runtime}</p>
        <p><strong>📖 Beskrivelse:</strong><br>${fullMovie.overview}</p>
        <p style="color:${exists ? 'lime' : 'orange'};">${exists ? "✅ Allerede i samling" : "🆕 Ikke lagret ennå"}</p>
        ${!exists ? `<button>➕ Legg til</button>` : ""}
      `;

      if (!exists) {
        div.querySelector("button").addEventListener("click", async () => {
          await setDoc(doc(db, "movies", fullMovie.id), fullMovie);
          alert(`${fullMovie.title} lagt til!`);
          div.querySelector("p:last-of-type").textContent = "✅ Allerede i samling";
          div.querySelector("p:last-of-type").style.color = "lime";
          div.querySelector("button").remove();
        });
      }

      container.appendChild(div);
    } catch (err) {
      console.error("Feil:", err);
    }
  }

  if (notFoundTitles.length) {
    const failedList = document.createElement("div");
    failedList.innerHTML = `
      <h2 style="color:tomato;">❌ Filmer ikke funnet på TMDb (${notFoundTitles.length})</h2>
      <ul>${notFoundTitles.map(t => `<li>${t}</li>`).join("")}</ul>
    `;
    container.appendChild(failedList);
  }
  console.log(`📦 Totalt i fil: ${importedMovies.length}, ✅ lagt til: ${newMovies.length}, ❌ ikke funnet: ${notFoundTitles.length}`);
};

window.addAll = async function () {
  if (!newMovies.length) return alert("Ingen nye filmer å legge til.");
  for (const movie of newMovies) {
    await setDoc(doc(db, "movies", movie.id), movie);
  }
  alert(`La til ${newMovies.length} nye filmer!`);
  window.loadAndSearch();
};
