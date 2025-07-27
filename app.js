// === Firebase og TMDB-integrasjon ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// === Firebase config ===
const firebaseConfig = {
  apiKey: "AIzaSyAHoNIX-Pu58-faT0IV0QfSajvx0j9hABQ",
  authDomain: "dvd-arkivet.firebaseapp.com",
  projectId: "dvd-arkivet",
  storageBucket: "dvd-arkivet.appspot.com",
  messagingSenderId: "936877330102",
  appId: "1:936877330102:web:8444ad9e0743617ea22017"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const collectionRef = collection(db, "movies");

const tmdbApiKey = "db3d7987e3a39baedf6bc138afa46e74"; // ← Sett inn din TMDB API-nøkkel her

// === Globale variabler ===
let allMovies = [];
let currentMovie = null;

// === DOM-elementer ===
const collectionList = document.getElementById("collectionList");
const titleInput = document.getElementById("titleInput");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");
const movieDetails = document.getElementById("movieDetails");
const addBtn = document.getElementById("addBtn");
const manualTitleInput = document.getElementById("manualTitle");
const manualAddBtn = document.getElementById("manualAddBtn");
const themeSelect = document.getElementById("themeSelect");
const genreFilter = document.getElementById("genreFilter");
const yearFilter = document.getElementById("yearFilter");
const resetBtn = document.getElementById("resetBtn");

// === Init ===
document.addEventListener("DOMContentLoaded", async () => {
  await loadCollection();
  renderCollection();
  populateFilters();
});

// === Hent samling fra Firebase ===
async function loadCollection() {
  const snapshot = await getDocs(collectionRef);
  allMovies = snapshot.docs.map(doc => doc.data());
}

// === Lagre film til Firebase ===
async function saveMovie(movie) {
  if (!movie.id) movie.id = Date.now();
  await setDoc(doc(collectionRef, movie.id.toString()), movie);
  const existingIndex = allMovies.findIndex(m => m.id === movie.id);
  if (existingIndex >= 0) allMovies[existingIndex] = movie;
  else allMovies.push(movie);
  renderCollection();
  populateFilters();
}

// === Slett film ===
async function deleteMovie(id) {
  await deleteDoc(doc(collectionRef, id.toString()));
  allMovies = allMovies.filter(m => m.id !== id);
  renderCollection();
  populateFilters();
}

// === Render samling ===
function renderCollection() {
  collectionList.innerHTML = "";
  allMovies.forEach(movie => {
    const card = document.createElement("li");
    card.className = "movie-card";

    const img = document.createElement("img");
    img.src = movie.cover || "https://via.placeholder.com/300x450?text=No+Image";
    img.alt = movie.title;
    img.className = "poster";

    const title = document.createElement("h4");
    title.textContent = movie.title;

    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️";
    delBtn.className = "delete-btn";
    delBtn.onclick = () => {
      if (confirm(`Slette "${movie.title}"?`)) deleteMovie(movie.id);
    };

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(delBtn);
    card.addEventListener("click", () => showMovieDetails(movie));
    collectionList.appendChild(card);
  });
}

// === Fyll filtermenyene ===
function populateFilters() {
  const genres = new Set();
  const years = new Set();

  allMovies.forEach(movie => {
    const genreList = Array.isArray(movie.genre) ? movie.genre : [movie.genre];
    genreList.forEach(g => g && genres.add(g));
    if (movie.year) years.add(movie.year);
  });

  genreFilter.innerHTML = `<option value="">Alle</option>` + [...genres].sort().map(g => `<option value="${g}">${g}</option>`).join("");
  yearFilter.innerHTML = `<option value="">Alle</option>` + [...years].sort().map(y => `<option value="${y}">${y}</option>`).join("");
}

// === Nullstill søk ===
resetBtn?.addEventListener("click", () => {
  genreFilter.value = "";
  yearFilter.value = "";
  renderCollection();
});

// === TMDb søk ===
searchBtn?.addEventListener("click", async () => {
  const query = titleInput.value.trim();
  if (!query) return;
  const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}`);
  const data = await res.json();
  displaySearchResults(data.results || []);
});

function displaySearchResults(results) {
  searchResults.innerHTML = "";
  results.forEach(movie => {
    const div = document.createElement("div");
    div.className = "search-result";
    div.addEventListener("click", () => displayMovieDetails(movie));
    div.textContent = movie.title;
    div.addEventListener("click", () => fetchMovieDetails(movie.id));
    searchResults.appendChild(div);
  });
}

// === Hent detaljer fra TMDb ===
async function fetchMovieDetails(id) {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${tmdbApiKey}&append_to_response=credits`);
  const data = await res.json();
  displayMovie(data);
}

// === Vis detaljert info og klargjør for lagring ===
function displayMovie(movie) {
  const director = movie.credits?.crew?.find(p => p.job === "Director")?.name || "Ukjent";
  const cast = movie.credits?.cast?.slice(0, 5).map(a => a.name).join(", ") || "Ukjent";
  const genres = movie.genres?.map(g => g.name) || [];
  const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : "";

  movieDetails.innerHTML = `
    <h3>${movie.title}</h3>
    <img src="${poster}" alt="Poster" class="poster" />
    <p><strong>📖 Oversikt:</strong> ${movie.overview || "Ingen beskrivelse."}</p>
    <p><strong>🎭 Sjanger:</strong> ${genres.join(", ")}</p>
    <p><strong>🎬 Regissør:</strong> ${director}</p>
    <p><strong>🎭 Skuespillere:</strong> ${cast}</p>
    <p><strong>📅 År:</strong> ${movie.release_date?.split("-")[0] || "?"}</p>
  `;

  addBtn.style.display = "block";
  addBtn.onclick = () => addToCollection(movie);
}

// === Legg til film fra TMDb ===
async function addToCollection(movie) {
  const genres = movie.genres?.map(g => g.name) || [];
  const cast = movie.credits?.cast?.slice(0, 5).map(a => a.name).join(", ") || "";

  const newMovie = {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    year: movie.release_date?.split("-")[0] || "",
    genre: genres,
    director: movie.credits?.crew?.find(p => p.job === "Director")?.name || "",
    cast: cast,
    runtime: movie.runtime || "",
    cover: movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : "",
    backcover: "",
    added: new Date().toISOString().split("T")[0]
  };

  currentMovie = newMovie;
  await saveMovie(newMovie);
  searchResults.innerHTML = "";
  movieDetails.innerHTML = "";
  titleInput.value = "";
  addBtn.style.display = "none";
}


// === Legg til film manuelt ===
manualAddBtn?.addEventListener("click", async () => {
  const title = manualTitleInput.value.trim();
  if (!title) return;

  const movie = {
    id: Date.now(),
    title,
    genre: [],
    year: "",
    cover: "",
    backcover: "",
    overview: "",
    added: new Date().toISOString().split("T")[0]
  };

  currentMovie = movie;
  await saveMovie(movie);
  manualTitleInput.value = "";
});
function showMovieDetails(movie) {
  const title = movie.title || "Ukjent tittel";
  const overview = movie.overview || "Ingen beskrivelse tilgjengelig.";
  const poster = movie.cover
    || (movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : "https://via.placeholder.com/300x450?text=No+Image");
  const year = movie.year || (movie.release_date?.split("-")[0]) || "Ukjent år";
  const director = movie.director || "Ukjent";
  const cast = movie.cast || "Ukjent";
  const genres = Array.isArray(movie.genre) ? movie.genre.join(", ") : (movie.genre || "Ukjent");

  movieDetails.innerHTML = `
    <div class="details-card">
      <img src="${poster}" alt="Poster for ${title}" class="details-poster" />
      <div class="details-info">
        <h3>${title}</h3>
        <p><strong>📅 Utgivelsesår:</strong> ${year}</p>
        <p><strong>🎭 Sjanger:</strong> ${genres}</p>
        <p><strong>🎬 Regissør:</strong> ${director}</p>
        <p><strong>🎭 Skuespillere:</strong> ${cast}</p>
        <p><strong>📖 Beskrivelse:</strong><br>${overview}</p>
        <button id="closeDetailsBtn">Lukk</button>
      </div>
    </div>
  `;

  // Skjul "Legg til"-knappen
  addBtn.style.display = "none";

  // Lukk-knapp fjerner detaljvisning
  const closeBtn = document.getElementById("closeDetailsBtn");
  closeBtn?.addEventListener("click", () => {
    movieDetails.innerHTML = "";
  });
}



function displayMovieDetails(movie) {
  const movieDetails = document.getElementById("movieDetails");
  if (!movieDetails) return;

  currentMovie = movie;

  const title = movie.title || "Ukjent tittel";
  const overview = movie.overview || "Ingen beskrivelse tilgjengelig.";
  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://via.placeholder.com/300x450?text=No+Image";
  const year = movie.release_date?.split("-")[0] || "Ukjent år";

  movieDetails.innerHTML = `
    <div class="movie-card">
      <h2>${title} (${year})</h2>
      <img src="${poster}" alt="${title}" />
      <p>${overview}</p>
      <button id="addMovieBtn">➕ Legg til i samling</button>
    </div>
  `;

  const addBtn = document.getElementById("addMovieBtn");
  addBtn?.addEventListener("click", addMovie);
}




async function addMovie() {
  if (!currentMovie) return;
  const movieId = currentMovie.id.toString();
  try {
    await setDoc(doc(collectionRef, movieId), currentMovie);
    alert("🎉 Filmen ble lagt til i samlingen!");
  } catch (err) {
    console.error("Feil ved lagring:", err);
    alert("❌ Kunne ikke lagre filmen.");
  }
}



