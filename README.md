# Dashboard Perumahan Negeri Selangor — V2

Dashboard statik untuk GitHub Pages berdasarkan dataset `PERUMAHAN_NEGERI_SELANGOR` (GTS 2025).

## Kandungan
- Statistik penuh 1,083,443 rekod melalui `summary.json`
- Penapis Daerah, PBT dan Kategori
- KPI, carta analisis dan jadual PBT
- Peta Leaflet dengan 18,000 poligon sampel sebenar yang dipilih secara berstrata daripada 12 PBT
- Popup maklumat kategori, subkategori, daerah, PBT dan keluasan lot
- Peta dan semua analisis diselaraskan dengan penapis

## Kenapa peta menggunakan sampel?
Dataset asal mempunyai lebih 1 juta poligon. Memuatkan semua poligon sebagai GeoJSON pada GitHub Pages akan menyebabkan muatan sangat besar dan browser perlahan. Statistik dashboard tetap menggunakan keseluruhan rekod; hanya visualisasi lot pada peta menggunakan sampel berstrata 18,000 poligon sebenar.

## Deploy GitHub Pages
Upload semua fail/folder ini ke root repository, kemudian `Settings > Pages > Deploy from a branch > main > /(root)`.

Jangan ubah struktur folder `data/` kerana `data/housing_sample.geojson` digunakan oleh peta.
