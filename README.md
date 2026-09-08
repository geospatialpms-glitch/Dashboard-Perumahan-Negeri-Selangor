# Dashboard Perumahan Negeri Selangor V3

Dashboard statik untuk GitHub Pages menggunakan dataset **PERUMAHAN_NEGERI_SELANGOR (GTS 2025)**.

## Apa yang baharu dalam V3

- Statistik penuh: **1,083,443 rekod**.
- Enjin peta **MapLibre GL / WebGL**.
- Overview seluruh negeri menggunakan 18,000 poligon berstrata.
- Semua lot disediakan sebagai **12 fail vektor berasingan mengikut PBT**.
- Apabila satu PBT dipilih, dashboard memuatkan **semua poligon PBT tersebut**, bukan sampel.
- Fail peta dimampatkan menggunakan GZIP supaya sesuai untuk hosting statik GitHub Pages.
- Geometri web disederhanakan pada toleransi kira-kira **0.75 meter** dan koordinat 6 tempat perpuluhan untuk mengurangkan saiz tanpa mengubah statistik asal.
- Filter Daerah, PBT dan Kategori menyelaras KPI, carta, jadual dan peta.
- Klik poligon untuk melihat kategori, subkategori, daerah, PBT, keluasan dan nombor lot jika tersedia.

## Struktur wajib di GitHub

```
index.html
styles.css
app.js
summary.json
README.md
data/
  summary.json
  manifest.json
  overview.geojson.gz
  pbt/
    210301.geojson.gz
    ...
    210312.geojson.gz
```

Jangan ubah struktur folder `data/pbt` kerana `manifest.json` merujuk laluan tersebut.

## GitHub Pages

Repository > Settings > Pages > Deploy from a branch > `main` > `/(root)` > Save.

Kemudian buka laman GitHub Pages repository dan buat hard refresh (`Ctrl + Shift + R`).

## Nota prestasi

GitHub Pages ialah hosting statik. V3 tidak cuba memuatkan kesemua 1.08 juta poligon pada masa yang sama. Ia memuatkan data penuh **satu PBT pada satu masa**, yang jauh lebih stabil untuk browser dan masih membolehkan keseluruhan dataset dicapai.
