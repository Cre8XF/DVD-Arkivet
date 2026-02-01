
export let allMovies = [];

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
  updateDropdowns();
  const filters = getActiveFilters();
  const filtered = filterMovies(allMovies, filters);
  renderMovies(filtered);
  updateActiveFiltersDisplay(filters.year, filters.genre, filters.search, filters.format);
}

function updateActiveFiltersDisplay(year, genre, search, format) {
  const display = document.getElementById("activeFilters");
  const filters = [];
  if (genre) filters.push(genre);
  if (year) filters.push(year);
  if (format) filters.push(format);
  if (search) filters.push(`"${search}"`);
  display.textContent = filters.length ? `🎯 Viser: ${filters.join(" | ")}` : "";
}

// === Cascading filter helpers ===

function getActiveFilters() {
  return {
    genre: document.getElementById("genreFilter").value,
    year: document.getElementById("yearFilter").value,
    format: document.getElementById("formatFilter").value,
    search: document.getElementById("searchInput").value.trim().toLowerCase()
  };
}

function filterMovies(movies, filters, ignoreKey) {
  let result = movies;

  if (ignoreKey !== "year" && filters.year) {
    result = result.filter(m => m.year == filters.year);
  }
  if (ignoreKey !== "genre" && filters.genre) {
    result = result.filter(m => {
      if (typeof m.genres === "string") return m.genres.includes(filters.genre);
      if (Array.isArray(m.genres)) return m.genres.includes(filters.genre);
      return false;
    });
  }
  if (ignoreKey !== "format" && filters.format) {
    result = result.filter(m => m.format?.toLowerCase() === filters.format.toLowerCase());
  }
  if (ignoreKey !== "search" && filters.search) {
    result = result.filter(m =>
      (m.title && m.title.toLowerCase().includes(filters.search)) ||
      (m.actors && m.actors.toLowerCase().includes(filters.search)) ||
      (m.director && m.director.toLowerCase().includes(filters.search)) ||
      (m.overview && m.overview.toLowerCase().includes(filters.search)) ||
      (m.format && m.format.toLowerCase().includes(filters.search))
    );
  }

  return result;
}

function extractGenres(movies) {
  const genres = new Set();
  movies.forEach(m => {
    if (typeof m.genres === "string") m.genres.split("|").forEach(g => genres.add(g.trim()));
    if (Array.isArray(m.genres)) m.genres.forEach(g => genres.add(g));
  });
  return [...genres].filter(Boolean).sort();
}

function extractYears(movies) {
  return [...new Set(movies.map(m => m.year).filter(Boolean))].sort((a, b) => b - a);
}

function extractFormats(movies) {
  return [...new Set(movies.map(m => m.format).filter(Boolean))].sort();
}

function rebuildDropdown(selectEl, options, defaultLabel, currentValue) {
  selectEl.innerHTML = "";
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = defaultLabel;
  selectEl.appendChild(defaultOpt);

  let valueStillValid = false;
  options.forEach(val => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = val;
    selectEl.appendChild(opt);
    if (String(val) === String(currentValue)) valueStillValid = true;
  });

  selectEl.value = valueStillValid ? currentValue : "";
}

function updateDropdowns() {
  const filters = getActiveFilters();

  const moviesForGenre = filterMovies(allMovies, filters, "genre");
  const moviesForYear = filterMovies(allMovies, filters, "year");
  const moviesForFormat = filterMovies(allMovies, filters, "format");

  rebuildDropdown(document.getElementById("genreFilter"), extractGenres(moviesForGenre), "Velg sjanger", filters.genre);
  rebuildDropdown(document.getElementById("yearFilter"), extractYears(moviesForYear), "Velg år", filters.year);
  rebuildDropdown(document.getElementById("formatFilter"), extractFormats(moviesForFormat), "Velg format", filters.format);

  // Second pass: if any value was auto-reset, recompute with corrected state
  const corrected = getActiveFilters();
  if (corrected.genre !== filters.genre || corrected.year !== filters.year || corrected.format !== filters.format) {
    const mg = filterMovies(allMovies, corrected, "genre");
    const my = filterMovies(allMovies, corrected, "year");
    const mf = filterMovies(allMovies, corrected, "format");
    rebuildDropdown(document.getElementById("genreFilter"), extractGenres(mg), "Velg sjanger", corrected.genre);
    rebuildDropdown(document.getElementById("yearFilter"), extractYears(my), "Velg år", corrected.year);
    rebuildDropdown(document.getElementById("formatFilter"), extractFormats(mf), "Velg format", corrected.format);
  }
}

function showDetails(movie) {
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
  try {
    const response = await fetch("json/collection.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    allMovies = await response.json();
  } catch (err) {
    document.getElementById("collectionList").innerHTML =
      `<p style="color:red;text-align:center;">Kunne ikke laste filmsamlingen: ${err.message}</p>`;
    return;
  }
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
    if (val === "imdb-desc") sorted.sort((a, b) => (parseFloat(b.imdbRating) || 0) - (parseFloat(a.imdbRating) || 0));
    if (val === "imdb-asc") sorted.sort((a, b) => (parseFloat(a.imdbRating) || 0) - (parseFloat(b.imdbRating) || 0));
    if (val === "runtime-desc") sorted.sort((a, b) => (parseRuntime(b.runtime) - parseRuntime(a.runtime)));
    if (val === "runtime-asc") sorted.sort((a, b) => (parseRuntime(a.runtime) - parseRuntime(b.runtime)));
    renderMovies(sorted);
  });

  const yearFilter = document.getElementById("yearFilter");
  const genreFilter = document.getElementById("genreFilter");
  const formatFilter = document.getElementById("formatFilter");

  updateDropdowns();

  yearFilter.addEventListener("change", applyAllFilters);
  genreFilter.addEventListener("change", applyAllFilters);
  formatFilter.addEventListener("change", applyAllFilters);

  const themeSelect = document.getElementById("themeSelect");
  themeSelect.addEventListener("change", () => {
    document.body.className = "";
    if (themeSelect.value) document.body.classList.add(themeSelect.value);
  });

  document.getElementById("searchInput").addEventListener("input", applyAllFilters);

  document.getElementById("resetBtn").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    sortSelect.value = "title-asc";
    themeSelect.value = "";
    document.body.className = "";
    updateDropdowns();
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

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = document.getElementById("modalOverlay");
      if (modal && !modal.classList.contains("is-hidden")) {
        modal.classList.add("is-hidden");
      }
    }
  });

};

function parseRuntime(runtime) {
  if (!runtime) return 0;
  const match = runtime.match(/(\d+):(\d+)/);
  if (!match) return 0;
  const [, h, m] = match.map(Number);
  return h * 60 + m;
}
