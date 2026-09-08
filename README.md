# Dashboard Perumahan Negeri Selangor

Dashboard web statik untuk GitHub Pages berasaskan dataset `GTS2025_PERUMAHAN`.

## Fungsi
- KPI jumlah rekod, keluasan, daerah dan PBT
- Penapis Daerah, PBT dan kategori perumahan
- Peta interaktif berasaskan Leaflet + OpenStreetMap
- Carta kategori, ranking daerah dan subkategori
- Jadual ranking PBT dengan carian
- Responsif untuk desktop dan telefon

## Deploy ke GitHub Pages
1. Cipta repository baharu di GitHub, contoh `dashboard-perumahan-selangor`.
2. Upload semua fail dalam folder ini ke root repository.
3. Buka **Settings → Pages**.
4. Pada **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih branch `main` dan folder `/ (root)`, kemudian Save.
6. Laman akan tersedia di alamat GitHub Pages repository tersebut.

## Struktur
- `index.html` – halaman utama
- `styles.css` – reka bentuk dashboard
- `app.js` – logik filter, carta dan peta
- `data/summary.json` – data agregat ringan daripada shapefile asal

> Shapefile asal mengandungi lebih 1 juta poligon dan tidak dimasukkan terus supaya GitHub Pages kekal laju.
