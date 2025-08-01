// === DVD Profiler: app.js med forbedret filtrering ===
import { openEditPanel } from "./edit.js";
let currentMovieId = null;
let allMovies = [];

function updateMovieCount(count) {
  const countElem = document.getElementById("movieCount");
  if (countElem) countElem.textContent = `Totalt: ${count} filmer`;
}

function renderMovies(movies) {
  const container = document.getElementById("collectionList");
  container.innerHTML = "";

  movies.forEach(movie => {
    const card = document.createElement("div");
    card.className = "movie-card";

    const title = movie.title || "Ukjent tittel";
    const year = movie.year || "";
    const poster = movie.poster || './images/placeholder.jpg';

    card.innerHTML = `
      <img src="${poster}" alt="${title}">
      <div class="movie-info">
        <h3>${title}</h3>
        <p>${year}</p>
      </div>
    `;
    card.onclick = () => showDetails(movie);
    container.appendChild(card);
  });

  updateMovieCount(movies.length);
}

function applyAllFilters() {
  const yearVal = document.getElementById("yearFilter").value;
  const genreVal = document.getElementById("genreFilter").value;
  const searchVal = document.getElementById("searchInput").value.trim().toLowerCase();

  let filtered = [...allMovies];

  if (yearVal) filtered = filtered.filter(m => m.year == yearVal);
  if (genreVal) filtered = filtered.filter(m => {
    if (typeof m.genres === "string") return m.genres.includes(genreVal);
    if (Array.isArray(m.genres)) return m.genres.includes(genreVal);
    return false;
  });
  if (searchVal) {
    filtered = filtered.filter(m =>
      (m.title && m.title.toLowerCase().includes(searchVal)) ||
      (m.actors && m.actors.toLowerCase().includes(searchVal))
    );
  }

  renderMovies(filtered);
  updateActiveFiltersDisplay(yearVal, genreVal, searchVal);
}

function updateActiveFiltersDisplay(year, genre, search) {
  const display = document.getElementById("activeFilters");
  const filters = [];
  if (genre) filters.push(genre);
  if (year) filters.push(year);
  if (search) filters.push(`\"${search}\"`);
  display.textContent = filters.length ? `🎯 Viser: ${filters.join(" | ")}` : "";
}

function showDetails(movie) {
  currentMovieId = movie.id;
  const modal = document.getElementById("modalOverlay");
  const content = document.getElementById("modalDetails");

  content.innerHTML = `
    <h2>${movie.title} (${movie.year})</h2>
    <div class="modal-flex">
      <img src="${movie.poster || './images/placeholder.jpg'}" alt="${movie.title}">
      <div class="movie-meta">
        <p><strong>Regissør:</strong> ${movie.director || "Ukjent"}</p>
        <p><strong>Skuespillere:</strong> ${movie.actors || "Ukjent"}</p>
        <p><strong>Varighet:</strong> ${movie.runtime || "?"}</p>
        <p><strong>IMDb:</strong> ${movie.imdbRating ? movie.imdbRating + ' ⭐️' : "?"}</p>
      </div>
    </div>
    <p><strong>Beskrivelse:</strong><br>${movie.overview || "Ingen beskrivelse."}</p>
    ${movie.imdbUrl ? `<a href="${movie.imdbUrl}" target="_blank">🔗 IMDb-side</a>` : ""}
    <div class="detail-actions">
      <button id="deleteMovieBtn">🗑️ Slett</button>
    </div>
  `;

  modal.classList.remove("is-hidden");

  document.getElementById("deleteMovieBtn").onclick = () => {
    if (confirm(`Slett "${movie.title}" fra samlingen?`)) {
      const updated = allMovies.filter(m => m.id !== movie.id);
      localStorage.setItem("collection", JSON.stringify(updated));
      modal.classList.add("is-hidden");
      renderMovies(updated);
    }
  };
  document.getElementById("closeModal").onclick = () => {
    modal.classList.add("is-hidden");
  };

  const prevBtn = document.getElementById("prevMovie");
  const nextBtn = document.getElementById("nextMovie");
  const currentIndex = allMovies.findIndex(m => m.id === movie.id);

  if (prevBtn && nextBtn) {
    prevBtn.disabled = currentIndex <= 0;
    nextBtn.disabled = currentIndex >= allMovies.length - 1;

    prevBtn.onclick = () => {
      if (currentIndex > 0) showDetails(allMovies[currentIndex - 1]);
    };
    nextBtn.onclick = () => {
      if (currentIndex < allMovies.length - 1) showDetails(allMovies[currentIndex + 1]);
    };
  }
}

window.onload = async () => {
  allMovies = await fetch("json/collection.json").then(r => r.json());
  allMovies.forEach((m, i) => { if (!m.id) m.id = i + 1 });

  renderMovies(allMovies);

  const sortSelect = document.getElementById("sortSelect");
  sortSelect.addEventListener("change", () => {
    const val = sortSelect.value;
    let sorted = [...allMovies];
    if (val === "title-asc") sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (val === "title-desc") sorted.sort((a, b) => b.title.localeCompare(a.title));
    if (val === "year-asc") sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
    if (val === "year-desc") sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
    renderMovies(sorted);
  });

  const yearFilter = document.getElementById("yearFilter");
const years = [...new Set(allMovies.map(m => m.year).filter(Boolean))].sort((a, b) => b - a);

// Legg til tom "Velg år"-opsjon først
const defaultYearOption = document.createElement("option");
defaultYearOption.value = "";
defaultYearOption.textContent = "Velg år";
yearFilter.appendChild(defaultYearOption);

// Legg til år
years.forEach(y => {
  const opt = document.createElement("option");
  opt.value = y;
  opt.textContent = y;
  yearFilter.appendChild(opt);
});

yearFilter.addEventListener("change", applyAllFilters);


  const genreFilter = document.getElementById("genreFilter");
  const genres = new Set();
  allMovies.forEach(m => {
    if (typeof m.genres === "string") m.genres.split("|").forEach(g => genres.add(g.trim()));
    if (Array.isArray(m.genres)) m.genres.forEach(g => genres.add(g));
  });
  [...genres].sort().forEach(g => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    genreFilter.appendChild(opt);
  });
  genreFilter.addEventListener("change", applyAllFilters);

  const themeSelect = document.getElementById("themeSelect");
  themeSelect.addEventListener("change", () => {
    document.body.className = "";
    if (themeSelect.value) document.body.classList.add(themeSelect.value);
  });

  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", applyAllFilters);

  const resetBtn = document.getElementById("resetBtn");
  resetBtn.addEventListener("click", () => {
    genreFilter.value = "";
    yearFilter.value = "";
    searchInput.value = "";
    sortSelect.value = "title-asc";
    themeSelect.value = "";
    document.body.className = "";
    renderMovies(allMovies);
    updateActiveFiltersDisplay();
  });
const toggleFiltersBtn = document.getElementById("toggleFilters");
const filterPanel = document.getElementById("filterPanel");
const filterOverlay = document.getElementById("filterOverlay");
const closeFilterBtn = document.querySelector(".close-filter");

toggleFiltersBtn?.addEventListener("click", () => {
  filterPanel.classList.add("open");
  filterOverlay.classList.add("active");
});

closeFilterBtn?.addEventListener("click", () => {
  filterPanel.classList.remove("open");
  filterOverlay.classList.remove("active");
});

filterOverlay?.addEventListener("click", () => {
  filterPanel.classList.remove("open");
  filterOverlay.classList.remove("active");
});

};
