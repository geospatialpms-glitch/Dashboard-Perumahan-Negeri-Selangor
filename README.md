# Dashboard Perumahan Negeri Selangor V3.1 FIXED

Versi ini membaiki isu startup GitHub Pages. Statistik dan manifest utama di-embed dalam `data-inline.js`, jadi dashboard tidak lagi gagal hanya kerana `summary.json` atau `manifest.json` tidak ditemui semasa startup.

## Fail wajib di root repository

- `index.html`
- `styles.css`
- `app.js`
- `data-inline.js`
- `summary.json` (salinan/fallback)
- folder `data/` lengkap

Jangan upload folder V3.1 sebagai subfolder. Kandungan di atas mesti berada terus di root repository.

## GitHub Pages

Settings → Pages → Deploy from a branch → `main` → `/(root)`.

Selepas commit, tunggu deployment selesai dan lakukan hard refresh (`Ctrl+Shift+R`).

## Peta

Overview menggunakan `data/overview.geojson.gz`. Bila satu PBT dipilih, semua poligon PBT tersebut dimuatkan dari `data/pbt/<kod>.geojson.gz`. Fungsi pembaca gzip V3.1 turut mengesan jika respons sudah dinyahmampatkan oleh host/browser.
