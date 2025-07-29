import { db, collectionRef, saveMovieToFirestore, deleteMovieFromFirestore, loadMoviesFromFirestore } from "./firebase.js";
import { openEditPanel } from "./edit.js";

let allMovies = [];
let currentMovie = null;
let lastScrollY = 0;

const collectionList = document.getElementById("collectionList");
const themeSelect = document.getElementById("themeSelect");
const genreFilter = document.getElementById("genreFilter");
const yearFilter = document.getElementById("yearFilter");
const resetBtn = document.getElementById("resetBtn");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");
const addInput = document.getElementById("addInput");
const addBtn = document.getElementById("addBtn");
const tmdbInput = document.getElementById("tmdbInput");
const tmdbBtn = document.getElementById("tmdbBtn");
const tmdbResults = document.getElementById("tmdbResults");
const tmdbResetBtn = document.getElementById("tmdbResetBtn");
const tmdbApiKey = "db3d7987e3a39baedf6bc138afa46e74";

const toggleBtn = document.getElementById("toggleFilters");
const filtersPanel = document.getElementById("filterPanel");
toggleBtn?.addEventListener("click", () => filtersPanel?.classList.toggle("hidden"));

document.addEventListener("DOMContentLoaded", async () => {
  allMovies = await loadMoviesFromFirestore();

  allMovies = allMovies.map(movie => {
    if (Array.isArray(movie.genre) && movie.genre.length === 1 && movie.genre[0].includes("|")) {
      movie.genre = movie.genre[0].split("|").map(g => g.trim());
    }
    return movie;
  });

  renderCollection();
  populateFilters();
  applyTheme(themeSelect.value);
});

function sortMovies(movies) {
  const sortBy = sortSelect?.value || "title-asc";
  return [...movies].sort((a, b) => {
    const aTitle = (a.title || "").toLowerCase();
    const bTitle = (b.title || "").toLowerCase();
    const aYear = parseInt(a.year) || 0;
    const bYear = parseInt(b.year) || 0;
    const aDate = new Date(a.added || 0);
    const bDate = new Date(b.added || 0);

    switch (sortBy) {
      case "title-asc": return aTitle.localeCompare(bTitle);
      case "title-desc": return bTitle.localeCompare(aTitle);
      case "year-asc": return aYear - bYear;
      case "year-desc": return bYear - aYear;
      case "added-asc": return aDate - bDate;
      case "added-desc": return bDate - aDate;
      default: return 0;
    }
  });
}

function renderCollection() {
  collectionList.innerHTML = "";

  const genre = genreFilter?.value;
  const year = yearFilter?.value;
  const search = searchInput?.value.trim().toLowerCase();

  const filtered = allMovies.filter(movie => {
    const movieGenres = Array.isArray(movie.genre)
      ? movie.genre
      : typeof movie.genre === "string"
      ? movie.genre.split("|").map(g => g.trim())
      : [];

    const matchGenre = !genre || movieGenres.includes(genre);
    const matchYear = !year || movie.year === year;
    const matchSearch =
      !search ||
      movie.title?.toLowerCase().includes(search) ||
      movie.cast?.toLowerCase().includes(search);

    return matchGenre && matchYear && matchSearch;
  });

  const sorted = sortMovies(filtered);

  sorted.forEach(movie => {
    const card = document.createElement("li");
    card.className = "movie-card";
    card.innerHTML = `
      <img src="${movie.cover || "https://via.placeholder.com/300x450?text=No+Image"}" class="poster" alt="${movie.title}" />
      <h4>${movie.title}</h4>
      <button class="delete-btn">🗑️</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      if (confirm(`Slette "${movie.title}"?`)) deleteMovie(movie.id);
    });
    card.addEventListener("click", () => showMovieDetails(movie));
    collectionList.appendChild(card);
  });
}

function deleteMovie(id) {
  deleteMovieFromFirestore(id);
  allMovies = allMovies.filter(m => m.id !== id);
  renderCollection();
  populateFilters();
}

function showMovieDetails(movie) {
  lastScrollY = window.scrollY;
  const poster = movie.cover || "https://via.placeholder.com/300x450?text=No+Image";
  const genres = Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre || "Ukjent";
  const modalOverlay = document.getElementById("modalOverlay");
  const modalDetails = document.getElementById("modalDetails");

  modalDetails.innerHTML = `
    <div class="details-card">
      <img src="${poster}" alt="Poster for ${movie.title}" class="details-poster" />
      <div class="details-info">
        <h3>${movie.title}</h3>
        <p><strong>📅 Utgivelsesår:</strong> ${movie.year || "Ukjent år"}</p>
        <p><strong>🎭 Sjanger:</strong> ${genres}</p>
        <p><strong>🎬 Regissør:</strong> ${movie.director || "Ukjent"}</p>
        <p><strong>🎭 Skuespillere:</strong> ${movie.cast || "Ukjent"}</p>
        <p><strong>📖 Beskrivelse:</strong><br>${movie.overview || "Ingen beskrivelse tilgjengelig."}</p>
        <button id="editDetailsBtn">✏️ Rediger</button>
        <button id="closeDetailsBtn">Lukk</button>
      </div>
    </div>
  `;
  modalOverlay.classList.remove("is-hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  document.getElementById("editDetailsBtn")?.addEventListener("click", () => openEditPanel(movie));
  document.getElementById("closeDetailsBtn")?.addEventListener("click", () => {
    modalOverlay.classList.add("is-hidden");
    document.getElementById("editPanel").classList.add("is-hidden");
    modalDetails.innerHTML = "";
    window.scrollTo({ top: lastScrollY, behavior: "smooth" });
  });
}

function populateFilters() {
  const genreSet = new Set();
  const years = new Set();

  allMovies.forEach(movie => {
    const genreList = Array.isArray(movie.genre)
      ? movie.genre
      : typeof movie.genre === "string"
      ? movie.genre.split("|").map(g => g.trim())
      : [];

    genreList.forEach(g => g && genreSet.add(g));
    if (movie.year) years.add(movie.year);
  });

  genreFilter.innerHTML = `<option value="">Alle</option>` + [...genreSet].sort().map(g => `<option value="${g}">${g}</option>`).join("");
  yearFilter.innerHTML = `<option value="">Alle</option>` + [...years].sort().map(y => `<option value="${y}">${y}</option>`).join("");
}

function applyTheme(theme) {
  const themes = ["theme-neon", "theme-sunset", "theme-frost"];
  document.body.classList.remove(...themes);
  if (theme) document.body.classList.add(theme);
}

genreFilter?.addEventListener("change", () => renderCollection());
yearFilter?.addEventListener("change", () => renderCollection());
sortSelect?.addEventListener("change", () => renderCollection());
searchInput?.addEventListener("input", () => renderCollection());
themeSelect?.addEventListener("change", () => applyTheme(themeSelect.value));

tmdbResetBtn?.addEventListener("click", () => {
  tmdbInput.value = "";
  tmdbResults.innerHTML = "";
});
