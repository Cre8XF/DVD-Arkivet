// DVD Profiler App - JavaScript logikk med kortvisning, filter og stil
const tmdbApiKey = "db3d7987e3a39baedf6bc138afa46e74";
let currentMovie = null;

async function fetchMovieById(id) {
  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${tmdbApiKey}&language=en-US&append_to_response=credits`;
  const data = await fetch(url).then(res => res.json());
  currentMovie = data;
  displayMovie(data);
}

async function searchMovie(title) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}&language=en-US`;
  const data = await fetch(url).then(res => res.json());
  const results = data.results;
  const resultDiv = document.getElementById("searchResults");
  resultDiv.innerHTML = "";
  results.forEach(movie => {
    const div = document.createElement("div");
    div.textContent = `${movie.title} (${movie.release_date?.slice(0,4)})`;
    div.style.cursor = "pointer";
    div.onclick = () => fetchMovieById(movie.id);
    resultDiv.appendChild(div);
  });
}

function displayMovie(movie) {
  const container = document.getElementById("movieDetails");
  const genres = movie.genres?.map(g => g.name).join(", ") || "";
  const runtime = movie.runtime ? `${movie.runtime} min` : "";
  const language = movie.original_language?.toUpperCase() || "";
  const rating = movie.vote_average ? `${movie.vote_average}/10` : "";
  const cast = movie.credits?.cast?.slice(0, 5).map(p => p.name).join(", ") || "";
  const directors = movie.credits?.crew?.filter(p => p.job === "Director").map(p => p.name).join(", ") || "";

  container.innerHTML = `
    <h3>${movie.title} (${movie.release_date?.slice(0,4)})</h3>
    <img src="https://image.tmdb.org/t/p/w300${movie.poster_path}" alt="Poster">
    <p><strong>Genre:</strong> ${genres}</p>
    <p><strong>Director:</strong> ${directors}</p>
    <p><strong>Cast:</strong> ${cast}</p>
    <p><strong>Runtime:</strong> ${runtime}</p>
    <p><strong>Language:</strong> ${language}</p>
    <p><strong>Rating:</strong> ${rating}</p>
    <p>${movie.overview}</p>
  `;
  document.getElementById("addBtn").style.display = "inline-block";
}

function addToCollection() {
  if (!currentMovie) return;
  const stored = localStorage.getItem("collection") || "[]";
  const collection = JSON.parse(stored);
  const newItem = {
  title: currentMovie.title,
  tmdb_id: currentMovie.id,
  year: currentMovie.release_date?.slice(0,4),
  genre: currentMovie.genres?.map(g => g.name) || [],
  director: currentMovie.credits?.crew?.filter(p => p.job === "Director").map(p => p.name).join(", "),
  cast: currentMovie.credits?.cast?.slice(0, 5).map(p => p.name).join(", "),
  runtime: currentMovie.runtime,
  language: currentMovie.original_language,
  rating: currentMovie.vote_average,
  cover: `https://image.tmdb.org/t/p/w300${currentMovie.poster_path}`,
  overview: currentMovie.overview || "",  // 👈 denne må inn
  seen: false,
  location: "",
  added: new Date().toISOString().split("T")[0]
};

  collection.push(newItem);
  localStorage.setItem("collection", JSON.stringify(collection));
  renderCollection();
  populateFilters();
  document.getElementById("backCoverCameraInput").click();
  alert("Lagt til i samling!");
}

function renderCollection() {
  const container = document.getElementById("collectionList");
  container.innerHTML = "";
  const stored = localStorage.getItem("collection") || "[]";
  const collection = JSON.parse(stored);

  const genreFilter = document.getElementById("genreFilter").value;
  const yearFilter = document.getElementById("yearFilter").value;

  const filtered = collection.filter(item => {
    const genreMatch = genreFilter ? item.genre?.includes(genreFilter) : true;
    const yearMatch = yearFilter ? item.year === yearFilter : true;
    return genreMatch && yearMatch;
  });

  filtered.forEach(item => {
    const index = collection.indexOf(item); // riktig index i full samling
    const card = document.createElement("div");
    card.className = "movie-card";
    card.innerHTML = `
      <img src="${item.cover || 'https://via.placeholder.com/300x450?text=No+Image'}" alt="${item.title}" class="poster">
      <h4>${item.title} ${item.year ? `(${item.year})` : ""}</h4>
      <button class="delete-btn" data-index="${index}" title="Slett">🗑️</button>
    `;

    // Klikk på bilde eller tittel viser detaljer
    card.querySelector("img").onclick = () => showMovieDetails(item);
    card.querySelector("h4").onclick = () => showMovieDetails(item);

    container.appendChild(card);
  });

  // Koble slett-knapper
  document.querySelectorAll(".delete-btn").forEach(btn =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Ikke trigge kortvisning
      const index = parseInt(btn.getAttribute("data-index"));
      deleteFromCollection(index);
    })
  );
}

function deleteFromCollection(index) {
  const stored = localStorage.getItem("collection") || "[]";
  const collection = JSON.parse(stored);

  const item = collection[index];
  const msg = `Er du sikker på at du vil slette:\n\n"${item.title}"${item.year ? ` (${item.year})` : ""}`;
  if (confirm(msg)) {
    collection.splice(index, 1);
    localStorage.setItem("collection", JSON.stringify(collection));
    renderCollection();
  }
}

function populateFilters() {
  const stored = localStorage.getItem("collection") || "[]";
  const collection = JSON.parse(stored);
  const genres = new Set();
  const years = new Set();

  collection.forEach(item => {
    item.genre.forEach(g => genres.add(g));
    if (item.year) years.add(item.year);
  });

  const genreSelect = document.getElementById("genreFilter");
  const yearSelect = document.getElementById("yearFilter");

  genreSelect.innerHTML = '<option value="">Alle sjangre</option>';
  [...genres].sort().forEach(g => {
    const option = document.createElement("option");
    option.value = g;
    option.textContent = g;
    genreSelect.appendChild(option);
  });

  yearSelect.innerHTML = '<option value="">Alle år</option>';
  [...years].sort().reverse().forEach(y => {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
  });
}

function exportCollection() {
  const rawData = localStorage.getItem("collection") || "[]";
  const parsedData = JSON.parse(rawData);
  const formattedData = JSON.stringify(parsedData, null, 2); // <-- med innrykk
  const blob = new Blob([formattedData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "collection.json";
  a.click();
  URL.revokeObjectURL(url);
}


// Når DOM er lastet, initialiser visning og filtre
window.addEventListener("DOMContentLoaded", () => {
  renderCollection();
  populateFilters();
});

// Søkefunksjon
document.getElementById("searchBtn").addEventListener("click", () => {
  const title = document.getElementById("titleInput").value.trim();
  if (title) searchMovie(title);
});

// Legg til valgt film i samling
document.getElementById("addBtn").addEventListener("click", addToCollection);

// Eksporter samlingen som JSON
document.getElementById("exportBtn").addEventListener("click", exportCollection);

// Filtrering
document.getElementById("genreFilter").addEventListener("change", renderCollection);
document.getElementById("yearFilter").addEventListener("change", renderCollection);

// Nullstill søk og filtre
document.getElementById("resetBtn").addEventListener("click", () => {
  document.getElementById("titleInput").value = "";
  document.getElementById("genreFilter").value = "";
  document.getElementById("yearFilter").value = "";
  document.getElementById("searchResults").innerHTML = "";
  document.getElementById("movieDetails").innerHTML = "";
  renderCollection();
});

// Vis detaljer i popup (modal)
function showMovieDetails(item) {
  const modal = document.getElementById("movieModal");
  const content = document.getElementById("modalContent");

  content.innerHTML = `
    <h2>${item.title} (${item.year})</h2>
    <img src="${item.cover}" alt="Poster">
    <p><strong>Genre:</strong> ${item.genre.join(", ")}</p>
    <p><strong>Director:</strong> ${item.director}</p>
    <p><strong>Cast:</strong> ${item.cast}</p>
    <p><strong>Runtime:</strong> ${item.runtime} min</p>
    <p><strong>Language:</strong> ${item.language?.toUpperCase()}</p>
    <p><strong>Rating:</strong> ${item.rating}/10</p>
    <p><strong>Lagt til:</strong> ${item.added}</p>
    ${item.overview ? `<p><strong>Handling:</strong><br>${item.overview}</p>` : ""}
    ${item.backcover ? `<p><strong>Bakside:</strong><br><img src="${item.backcover}" alt="Bakside" style="max-width:100%; border-radius:8px; margin-top:1rem;">` : ""}
    <button onclick="closeModal()">Lukk</button>
  `;

  modal.style.display = "flex";
}


function closeModal() {
  document.getElementById("movieModal").style.display = "none";
}
const themeSelect = document.getElementById("themeSelect");
const themes = ["theme-neon", "theme-sunset", "theme-frost"];

// Hent lagret tema ved lasting
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.body.classList.add(savedTheme);
    themeSelect.value = savedTheme;
  }
});

// Endre tema når bruker velger
themeSelect.addEventListener("change", () => {
  // Fjern alle gamle tema-klasser
  document.body.classList.remove(...themes);
  
  // Legg til valgt klasse hvis ikke "standard"
  const selected = themeSelect.value;
  if (selected) {
    document.body.classList.add(selected);
    localStorage.setItem("theme", selected);
  } else {
    localStorage.removeItem("theme");
  }
});
document.getElementById("manualAddBtn").addEventListener("click", () => {
  const title = document.getElementById("manualTitle").value.trim();
  if (!title) return;

  const stored = localStorage.getItem("collection") || "[]";
  const collection = JSON.parse(stored);

  const newItem = {
    title: title,
    tmdb_id: null,
    year: "",
    genre: [],
    director: "",
    cast: "",
    runtime: "",
    language: "",
    rating: "",
    cover: "",
    overview: "",
    seen: false,
    location: "",
    added: new Date().toISOString().split("T")[0]
  };

  collection.push(newItem);
  localStorage.setItem("collection", JSON.stringify(collection));
  renderCollection();
  populateFilters();
}
);

// === Legg til film manuelt og åpne kamera ===
document.getElementById("manualAddForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("manualTitle").value.trim();
  if (!title) return;

  const newItem = {
    id: Date.now(), // unik ID
    title,
    genre: [],
    year: "",
    cover: "",
    backcover: ""
  };

  const stored = localStorage.getItem("collection") || "[]";
  const collection = JSON.parse(stored);
  collection.push(newItem);
  localStorage.setItem("collection", JSON.stringify(collection));

  currentMovie = newItem;

  // Åpne kamera etter liten forsinkelse
  const cameraInput = document.getElementById("backCoverCameraInput");

  if (cameraInput) {
    setTimeout(() => {
      cameraInput.click();
    }, 300);
  } else {
    console.warn("⚠️ backCoverCameraInput not found");
  }

  alert("Filmen ble lagt til manuelt!");
  document.getElementById("manualTitle").value = "";
  renderCollection();
});
