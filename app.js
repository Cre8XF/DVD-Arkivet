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

// === Globale variabler ===
let allMovies = [];
let currentMovie = null;
const tmdbApiKey = "db3d7987e3a39baedf6bc138afa46e74"; // ← Sett inn din TMDB API-nøkkel her

// === DOM-elementer ===
const collectionList = document.getElementById("collectionList");
const manualTitleInput = document.getElementById("manualTitle");
const manualAddBtn = document.getElementById("manualAddBtn");
const cameraInput = document.getElementById("backCoverCameraInput");
const titleInput = document.getElementById("titleInput");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");
const movieDetails = document.getElementById("movieDetails");
const addBtn = document.getElementById("addBtn");

// === Init ===
document.addEventListener("DOMContentLoaded", async () => {
  await loadCollection();
  renderCollection();
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
}
// === Slett film fra Firebase ===
async function deleteMovie(movieId) {
  await deleteDoc(doc(collectionRef, movieId.toString()));
  allMovies = allMovies.filter(m => m.id !== movieId);
}


// === Render samling ===
function renderCollection() {
  collectionList.innerHTML = "";
  allMovies.forEach(movie => {
    const card = document.createElement("div");
    card.className = "movie-card";

    const img = document.createElement("img");
    img.src = movie.cover || "https://via.placeholder.com/300x450?text=No+Image";
    img.alt = movie.title;
    img.className = "poster";

    const title = document.createElement("h4");
    title.textContent = movie.title;

    // 🗑️ Slett-knapp
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "🗑️";
    deleteBtn.title = "Slett film";
    deleteBtn.onclick = async (e) => {
      e.stopPropagation();
      if (confirm(`Slette filmen «${movie.title}» fra samlingen?`)) {
        await deleteMovie(movie.id);
        renderCollection();
      }
    };

    card.appendChild(deleteBtn);
    card.appendChild(img);
    card.appendChild(title);
    card.addEventListener("click", () => showDetails(movie));

    collectionList.appendChild(card);
  });
}


// === Vis detaljer (enkelt alert) ===
function showDetails(movie) {
  let info = `🎬 ${movie.title}\n\n`;
  if (movie.overview) info += `📖 ${movie.overview}\n\n`;
  if (movie.genre?.length) info += `🎭 Sjanger: ${movie.genre.join(", ")}\n`;
  if (movie.year) info += `📅 År: ${movie.year}\n`;
  alert(info);
}


// === Søk etter filmer i TMDb ===
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
    div.textContent = movie.title;
    div.addEventListener("click", () => showMovieDetails(movie));
    searchResults.appendChild(div);
  });
}

function showMovieDetails(movie) {
  movieDetails.innerHTML = `
    <h3>${movie.title}</h3>
    <p>${movie.overview || "Ingen beskrivelse tilgjengelig."}</p>
    <img src="https://image.tmdb.org/t/p/w300${movie.poster_path}" alt="Poster" />
  `;
  addBtn.style.display = "block";
  addBtn.onclick = () => addToCollection(movie);
}

async function addToCollection(movie) {
  const newMovie = {
    id: movie.id,
    title: movie.title,
    genre: [], // kan legges til senere
    year: (movie.release_date || "").split("-")[0],
    cover: movie.poster_path ? "https://image.tmdb.org/t/p/w300" + movie.poster_path : "",
    backcover: "",
    overview: movie.overview || "",
    added: new Date().toISOString().split("T")[0]
  };
  currentMovie = newMovie;
  await saveMovie(newMovie);
  renderCollection();

  setTimeout(() => {
    if (cameraInput) cameraInput.click();
  }, 300);
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
  renderCollection();

  setTimeout(() => {
    if (cameraInput) cameraInput.click();
  }, 300);

  manualTitleInput.value = "";
});

cameraInput?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || !currentMovie) return;

  const img = new Image();
  const reader = new FileReader();

  reader.onload = async () => {
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      const scale = 800 / img.width;
      canvas.width = 800;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const scaledDataUrl = canvas.toDataURL("image/jpeg", 0.8); // komprimert
      currentMovie.backcover = scaledDataUrl;
      await saveMovie(currentMovie);
      renderCollection();
    };
    img.src = reader.result;
  };

  reader.readAsDataURL(file);
});
