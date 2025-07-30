
let allMovies = [];

async function fetchCollection() {
  const res = await fetch("json/collection.json");
  const data = await res.json();
  return data;
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
        <button onclick='showDetails(${movie.id})'>Detaljer</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function showDetails(id) {
  const movie = allMovies.find(m => m.id == id);
  const modal = document.getElementById("modalOverlay");
  const content = document.getElementById("modalDetails");
  content.innerHTML = `
    <h2>${movie.title} (${movie.year})</h2>
    <img src="${movie.poster || './images/placeholder.jpg'}" alt="${movie.title}">
    <p><strong>Regissør:</strong> ${movie.director || "Ukjent"}</p>
    <p><strong>Skuespillere:</strong> ${movie.actors || "Ukjent"}</p>
    <p><strong>Varighet:</strong> ${movie.runtime || "?"}</p>
    <p><strong>IMDb:</strong> ${movie.imdbRating ? movie.imdbRating + ' ⭐️' : "?"}</p>
    <p><strong>Beskrivelse:</strong><br>${movie.overview}</p>
    ${movie.imdbUrl ? `<a href="${movie.imdbUrl}" target="_blank">🔗 IMDb-side</a>` : ""}
  `;
  modal.classList.remove("is-hidden");
}
window.showDetails = showDetails;
document.getElementById("closeModal").onclick = () => {
  document.getElementById("modalOverlay").classList.add("is-hidden");
};

document.getElementById("resetBtn").onclick = () => {
  document.getElementById("genreFilter").value = "";
  document.getElementById("yearFilter").value = "";
  document.getElementById("sortSelect").value = "title-asc";
  renderMovies(allMovies);
};

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
};
