# Dashboard Perumahan Negeri Selangor V3.2 FIXED

Versi ini membaiki kegagalan pemuatan poligon penuh PBT.

## Perubahan utama
- Tiada lagi fail `.geojson.gz` besar.
- Semua PBT dipecahkan kepada fail JavaScript kecil, maksimum kira-kira 10,000 fitur setiap chunk.
- Chunk dimuatkan satu demi satu dan menjadi MapLibre source berasingan.
- Jika satu fail tidak di-upload, mesej ralat memaparkan nama fail chunk yang hilang.
- Statistik 1,083,443 rekod kekal daripada data penuh.

## Penting ketika upload ke GitHub
Upload **semua** fail dan folder, termasuk keseluruhan `data/chunks/`. Jangan hanya upload fail root.

Struktur minimum:
```
index.html
styles.css
app.js
data-inline.js
summary.json
data/
  manifest.json
  summary.json
  chunks/
    overview/
    210301/ ... 210312/
```

Selepas commit, tunggu GitHub Pages deploy dan lakukan hard refresh (Ctrl+Shift+R).
