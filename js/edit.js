let currentMovieRef = null;
let collection = JSON.parse(localStorage.getItem("collection")) || [];

export function openEditPanel(movie) {
  currentMovieRef = movie;

  document.getElementById("editTitle").value = movie.title || "";
  document.getElementById("editYear").value = movie.year || "";
  document.getElementById("editGenre").value = movie.genres || "";
  document.getElementById("editRuntime").value = movie.runtime || "";
  document.getElementById("editDirector").value = movie.director || "";
  document.getElementById("editCast").value = movie.actors || "";
  document.getElementById("editImdb").value = movie.imdbUrl || "";
  document.getElementById("editOverview").value = movie.overview || "";
  document.getElementById("editPosterUrl").value = movie.poster || "";

  document.getElementById("modalOverlay").classList.remove("is-hidden");
  document.getElementById("editPanel").classList.remove("is-hidden");
}

document.getElementById("saveEditBtn")?.addEventListener("click", () => {
  if (!currentMovieRef) return;

  currentMovieRef.title = document.getElementById("editTitle").value;
  currentMovieRef.year = document.getElementById("editYear").value;
  currentMovieRef.genres = document.getElementById("editGenre").value;
  currentMovieRef.runtime = document.getElementById("editRuntime").value;
  currentMovieRef.director = document.getElementById("editDirector").value;
  currentMovieRef.actors = document.getElementById("editCast").value;
  currentMovieRef.imdbUrl = document.getElementById("editImdb").value;
  currentMovieRef.overview = document.getElementById("editOverview").value;

  const urlInput = document.getElementById("editPosterUrl").value?.trim();
  if (urlInput) {
    currentMovieRef.poster = urlInput;
    saveAndClose();
    return;
  }

  const fileInput = document.getElementById("editCoverUpload");
  if (fileInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = () => {
      currentMovieRef.poster = reader.result;
      saveAndClose();
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    saveAndClose();
  }
});

function saveAndClose() {
  // Oppdater lokalStorage (hvis brukt) – eller bare reload
  localStorage.setItem("collection", JSON.stringify(collection));
  document.getElementById("editPanel").classList.add("is-hidden");
  document.getElementById("modalOverlay").classList.add("is-hidden");
  showJsonExport(currentMovieRef);

  location.reload();
}
function showJsonExport(movie) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.bottom = "2rem";
  container.style.right = "2rem";
  container.style.maxWidth = "500px";
  container.style.background = "#1e1e1e";
  container.style.color = "#fff";
  container.style.border = "1px solid #444";
  container.style.borderRadius = "8px";
  container.style.padding = "1rem";
  container.style.zIndex = "9999";
  container.style.fontSize = "0.85rem";
  container.style.fontFamily = "monospace";
  container.style.boxShadow = "0 0 12px rgba(0,0,0,0.5)";

  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(movie, null, 2);

  const btn = document.createElement("button");
  btn.textContent = "📋 Kopier JSON";
  btn.style.marginTop = "0.5rem";
  btn.onclick = () => {
    navigator.clipboard.writeText(pre.textContent);
    btn.textContent = "✅ Kopiert!";
    setTimeout(() => (btn.textContent = "📋 Kopier JSON"), 2000);
  };

  const close = document.createElement("button");
  close.textContent = "✖";
  close.style.position = "absolute";
  close.style.top = "5px";
  close.style.right = "10px";
  close.style.background = "transparent";
  close.style.border = "none";
  close.style.color = "#fff";
  close.style.fontSize = "1rem";
  close.style.cursor = "pointer";
  close.onclick = () => container.remove();

  container.appendChild(close);
  container.appendChild(pre);
  container.appendChild(btn);
  document.body.appendChild(container);
}
