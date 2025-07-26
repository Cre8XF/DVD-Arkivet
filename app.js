// === Firebase-importer ===
import { getDocs, setDoc, doc, collection, getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

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

// === HTML-elementer ===
const collectionList = document.getElementById("collectionList");
const genreFilter = document.getElementById("genreFilter");
const yearFilter = document.getElementById("yearFilter");
const themeSelect = document.getElementById("themeSelect");
const manualAddForm = document.getElementById("manualAddForm");
const manualTitleInput = document.getElementById("manualTitle");
const cameraInput = document.getElementById("backCoverCameraInput");

// === INIT ===
document.addEventListener("DOMContentLoaded", async () => {
  await loadCollectionFromFirebase();
  renderCollection();
  populateFilters();

  // Temavelger
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.body.classList.add(savedTheme);
    themeSelect.value = savedTheme;
  }
});

// === Hent filmer fra Firebase ===
async function loadCollectionFromFirebase() {
  const snapshot = await getDocs(collectionRef);
  allMovies = snapshot.docs.map(doc => doc.data());
}

// === Lagre film til Firebase ===
async function saveMovieToFirebase(movie) {
  if (!movie.id) movie.id = Date.now();
  await setDoc(doc(collectionRef, movie.id.toString()), movie);
  const index = allMovies.findIndex(m => m.id === movie.id);
  if (index !== -1) {
    allMovies[index] = movie;
  } else {
    allMovies.push(movie);
  }
}

// === Render filmer ===
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

// === Fyll filtermenyer ===
function populateFilters() {
  const genres = new Set();
  const years = new Set();

  allMovies.forEach(movie => {
    (movie.genre || []).forEach(g => genres.add(g));
    if (movie.year) years.add(movie.year);
  });

  genreFilter.innerHTML = '<option value="">Alle</option>' + [...genres].sort().map(g => `<option value="${g}">${g}</option>`).join("");
  yearFilter.innerHTML = '<option value="">Alle</option>' + [...years].sort().map(y => `<option value="${y}">${y}</option>`).join("");
}

// === Legg til film manuelt ===
manualAddForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = manualTitleInput.value.trim();
  if (!title) return;

  const newItem = {
    id: Date.now(),
    title,
    genre: [],
    year: "",
    director: "",
    runtime: "",
    cover: "",
    backcover: "",
    overview: "",
    added: new Date().toISOString().split("T")[0]
  };

  currentMovie = newItem;
  await saveMovieToFirebase(newItem);
  renderCollection();
  populateFilters();

  // Start kamera
  if (cameraInput) {
    setTimeout(() => cameraInput.click(), 300);
  }

  manualTitleInput.value = "";
});

// === Ta bilde av baksiden ===
cameraInput?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || !currentMovie) return;

  const reader = new FileReader();
  reader.onload = async () => {
    currentMovie.backcover = reader.result;
    await saveMovieToFirebase(currentMovie);
    renderCollection();
  };
  reader.readAsDataURL(file);
});

// === Endre tema ===
themeSelect?.addEventListener("change", () => {
  const selected = themeSelect.value;
  document.body.className = "";
  document.body.classList.add(selected);
  localStorage.setItem("theme", selected);
});
