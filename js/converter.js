let parsedJson = [];

function convertToCSV() {
  if (!parsedJson.length) return alert("Ingen JSON-data lastet.");
  const keys = Object.keys(parsedJson[0]);
  const rows = parsedJson.map(obj => keys.map(k => JSON.stringify(obj[k] ?? "")).join(";"));
  const csv = [keys.join(";"), ...rows].join("\n");
  document.getElementById("csvOutput").value = csv;
}

function convertToJSON() {
  const file = document.getElementById("csvFile").files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.split("\n").filter(Boolean);
    const headers = lines[0].split(";");
    const data = lines.slice(1).map(line => {
      const values = line.split(";").map(v => {
        const trimmed = v.trim();
        try { return JSON.parse(trimmed); } catch { return trimmed; }
      });
      const obj = {};
      headers.forEach((h, i) => obj[h.trim()] = values[i]);
      return obj;
    });
    document.getElementById("jsonOutput").value = JSON.stringify(data, null, 2);
  };
  reader.readAsText(file);
}

function downloadCSV() {
  const csv = document.getElementById("csvOutput").value;
  if (!csv) return;
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "collection.csv";
  link.click();
}

function downloadJSON() {
  const json = document.getElementById("jsonOutput").value;
  if (!json) return;
  const blob = new Blob([json], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "collection_updated.json";
  link.click();
}

function copyJSON() {
  const json = document.getElementById("jsonOutput").value;
  if (!json) return;
  navigator.clipboard.writeText(json).then(() => alert("JSON kopiert!"));
}

document.getElementById("jsonFile").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    parsedJson = JSON.parse(e.target.result);
    alert(`Lest inn ${parsedJson.length} filmer.`);
  };
  reader.readAsText(file);
});
