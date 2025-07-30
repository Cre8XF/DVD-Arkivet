import json
import csv

# Last inn JSON-fil
with open("collection.json", "r", encoding="utf-8") as infile:
    movies = json.load(infile)

# Velg feltene du vil ha med
fields = ["title", "year", "genres", "runtime", "director", "format", "overview", "imdbRating", "imdbUrl", "actors", "barcode"]

# Skriv til CSV
with open("collection_export.csv", "w", encoding="utf-8", newline="") as outfile:
    writer = csv.DictWriter(outfile, fieldnames=fields)
    writer.writeheader()
    for movie in movies:
        writer.writerow({field: movie.get(field, "") for field in fields})
