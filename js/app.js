import { openEditPanel } from "./edit.js";
let currentMovieId = null;
let allMovies = [];

async function fetchCollection() {
  const res = await fetch("json/collection.json");
  const data = await res.json();
  return data;
}

function updateMovieCount(count) {
  const countElem = document.getElementById("movieCount");
  if (countElem) {
    countElem.textContent = `Totalt: ${count} filmer`;
  }
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

    // 👇 Hele kortet klikker for detaljer
    card.onclick = () => showDetails(movie);

    container.appendChild(card);
  });

  updateMovieCount(movies.length);
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
      <button id="editMovieBtn">✏️ Rediger</button>
      <button id="deleteMovieBtn">🗑️ Slett</button>
    </div>
  `;

  modal.classList.remove("is-hidden");

  // 🛠️ Rediger-knapp
  document.getElementById("editMovieBtn").onclick = () => openEditPanel(movie);

  // 🗑️ Slett-knapp
  document.getElementById("deleteMovieBtn").onclick = () => {
    if (confirm(`Slett "${movie.title}" fra samlingen?`)) {
      const updated = allMovies.filter(m => m.id !== movie.id);
      localStorage.setItem("collection", JSON.stringify(updated));
      modal.classList.add("is-hidden");
      renderMovies(updated);
    }
  };

  // ❌ Lukke-knapp (flyttet ut av if-blokken!)
  document.getElementById("closeModal").onclick = () => {
    modal.classList.add("is-hidden");
  };

  // ◀▶ Navigasjon
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



document.getElementById("sortSelect").addEventListener("change", () => {
  const val = document.getElementById("sortSelect").value;
  let sorted = [...allMovies];
  if (val === "title-asc") sorted.sort((a, b) => a.title.localeCompare(b.title));
  if (val === "title-desc") sorted.sort((a, b) => b.title.localeCompare(a.title));
  if (val === "year-asc") sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
  if (val === "year-desc") sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
  renderMovies(sorted);
});

window.onload = async () => {
  allMovies = await fetchCollection();
  allMovies.forEach((m, i) => { if (!m.id) m.id = i + 1 });

  renderMovies(allMovies);

  const years = [...new Set(allMovies.map(m => m.year).filter(Boolean))].sort((a, b) => b - a);
  const yearFilter = document.getElementById("yearFilter");
  years.forEach(y => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearFilter.appendChild(opt);
  });

  yearFilter.addEventListener("change", () => {
    const val = yearFilter.value;
    if (!val) return renderMovies(allMovies);
    renderMovies(allMovies.filter(m => m.year == val));
  });

  const genres = new Set();
  allMovies.forEach(m => {
    if (typeof m.genres === "string") m.genres.split("|").forEach(g => genres.add(g.trim()));
    if (Array.isArray(m.genres)) m.genres.forEach(g => genres.add(g));
  });

  const genreFilter = document.getElementById("genreFilter");
  [...genres].sort().forEach(g => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    genreFilter.appendChild(opt);
  });

  genreFilter.addEventListener("change", () => {
    const val = genreFilter.value;
    if (!val) return renderMovies(allMovies);
    renderMovies(allMovies.filter(m => {
      if (typeof m.genres === "string") return m.genres.includes(val);
      if (Array.isArray(m.genres)) return m.genres.includes(val);
      return false;
    }));
  });

  // Tema-velger
  const themeSelect = document.getElementById("themeSelect");
  themeSelect.addEventListener("change", () => {
    document.body.className = "";
    if (themeSelect.value) document.body.classList.add(themeSelect.value);
  });

  // Visningsmodus
  const viewModeSelect = document.getElementById("viewModeSelect");
  viewModeSelect.addEventListener("change", () => {
    const cl = document.getElementById("collectionList").classList;
    cl.remove("shelf-view", "standard-view");
    if (viewModeSelect.value === "shelf") cl.add("shelf-view");
    else cl.add("standard-view");
  });

  // Søkefelt
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return renderMovies(allMovies);
    renderMovies(allMovies.filter(m =>
      (m.title && m.title.toLowerCase().includes(query)) ||
      (m.actors && m.actors.toLowerCase().includes(query))
    ));
  });
  const toggleFiltersBtn = document.getElementById("toggleFilters");
const filterPanel = document.getElementById("filterPanel");


};
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

let touchStartX = 0;
let touchEndX = 0;

const modal = document.getElementById("modalOverlay");

modal.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

modal.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const delta = touchEndX - touchStartX;
  if (Math.abs(delta) < 50) return; // ikke nok bevegelse

  const currentIndex = allMovies.findIndex(m => m.id === currentMovieId);
  if (delta > 0 && currentIndex > 0) {
    showDetails(allMovies[currentIndex - 1]); // sveip høyre = forrige
  }
  if (delta < 0 && currentIndex < allMovies.length - 1) {
    showDetails(allMovies[currentIndex + 1]); // sveip venstre = neste
  }
}
const resetBtn = document.getElementById("resetBtn");
resetBtn?.addEventListener("click", () => {
  genreFilter.value = "";
  yearFilter.value = "";
  searchInput.value = "";
  sortSelect.value = "titleAsc";
  themeSelect.value = "";
  viewSelect.value = "grid";

  filteredMovies = [...allMovies]; // <- viktig linje!
  renderMovies(allMovies);
});
