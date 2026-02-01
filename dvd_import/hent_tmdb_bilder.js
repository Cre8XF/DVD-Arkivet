async function startProcess() {
  const fileInput = document.getElementById('fileInput');
  const apiKey = document.getElementById('apiKey').value.trim();
  const log = document.getElementById('log');
  if (!fileInput.files[0] || !apiKey) return alert("Velg fil og skriv inn API-nøkkel");

  const file = fileInput.files[0];
  const text = await file.text();
  let data = JSON.parse(text);

  const updated = [];
  for (let i = 0; i < data.length; i++) {
    const movie = data[i];
    const title = encodeURIComponent(movie.title);
    const year = (movie.year || "").substring(0, 4);
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${title}&year=${year}`;

    try {
      const res = await fetch(url);
      const json = await res.json();
      const posterPath = json?.results?.[0]?.poster_path;
      movie.poster = posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;
      log.value += `✅ ${movie.title} → ${movie.poster || "Ikke funnet"}\n`;
    } catch (e) {
      movie.poster = null;
      log.value += `❌ ${movie.title} → Feil: ${e.message}\n`;
    }
    updated.push(movie);
    await new Promise(r => setTimeout(r, 300));
  }

  const blob = new Blob([JSON.stringify(updated, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "collection_poster.json";
  link.click();
}
