# Dashboard Perumahan Negeri Selangor

Versi dibaiki dan diselaraskan dengan dataset `PERUMAHAN_NEGERI_SELANGOR.shp` (2025).

## Data dashboard

- 1,083,443 rekod
- 48,485.0787 hektar
- 9 daerah
- 12 PBT
- 4 kategori utama
- 20 subkategori

## Fail yang perlu berada di root GitHub repository

```text
index.html
styles.css
app.js
summary.json
README.md
data/summary.json   # salinan fallback
```

`app.js` akan cuba memuatkan `./summary.json` terlebih dahulu dan menggunakan `./data/summary.json` sebagai fallback. Ini mengelakkan isu dashboard kosong apabila struktur folder GitHub berubah.

## GitHub Pages

Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.

Selepas upload/replace fail, tunggu deployment selesai kemudian buat hard refresh (`Ctrl + Shift + R`).
