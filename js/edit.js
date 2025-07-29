import { saveMovieToFirestore } from "./firebase.js";

let currentMovieRef = null;

export function openEditPanel(movie) {
  if (!movie.id) movie.id = Date.now(); // ✅ sørg for ID for Firebase
  currentMovieRef = movie;
  document.getElementById("editTitle").value = movie.title || "";
  document.getElementById("editYear").value = movie.year || "";
  document.getElementById("editGenre").value = movie.genre?.join(", ") || "";
  document.getElementById("editRuntime").value = movie.runtime || "";
  document.getElementById("editDirector").value = movie.director || "";
  document.getElementById("editCast").value = movie.cast || "";
  document.getElementById("editImdb").value = movie.imdb || "";
  document.getElementById("editOverview").value = movie.overview || "";

  document.getElementById("modalOverlay").classList.remove("is-hidden");
  document.getElementById("editPanel").classList.remove("is-hidden");
}

document.getElementById("saveEditBtn")?.addEventListener("click", async () => {
  if (!currentMovieRef) return;

  currentMovieRef.title = document.getElementById("editTitle").value;
  currentMovieRef.year = document.getElementById("editYear").value;
  currentMovieRef.genre = document.getElementById("editGenre").value.split(",").map(g => g.trim());
  currentMovieRef.runtime = document.getElementById("editRuntime").value;
  currentMovieRef.director = document.getElementById("editDirector").value;
  currentMovieRef.cast = document.getElementById("editCast").value;
  currentMovieRef.imdb = document.getElementById("editImdb").value;
  currentMovieRef.overview = document.getElementById("editOverview").value;

  const fileInput = document.getElementById("editCoverUpload");
  if (fileInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = async function () {
      currentMovieRef.cover = reader.result;
      await finishSave();
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    await finishSave();
  }
});

async function finishSave() {
  await saveMovieToFirestore(currentMovieRef);
  document.getElementById("editPanel").classList.add("is-hidden");
  document.getElementById("modalOverlay").classList.add("is-hidden");
  location.reload();
}