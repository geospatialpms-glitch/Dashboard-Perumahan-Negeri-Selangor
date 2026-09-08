let DATA, GEO, typeChart, districtChart, subtypeChart, map, housingLayer;
const $=id=>document.getElementById(id);
const fmt=n=>new Intl.NumberFormat('ms-MY').format(Math.round(n));
const fmtArea=n=>new Intl.NumberFormat('ms-MY',{maximumFractionDigits:1}).format(n);
const colors={
  'Perumahan Bukan Strata':'#f59e0b',
  'Perumahan Strata':'#2563eb',
  'Kampung':'#16a34a',
  'Setinggan':'#dc2626',
  'Tidak Dinyatakan':'#64748b'
};
const palette=['#f59e0b','#2563eb','#16a34a','#dc2626','#8b5cf6','#0ea5e9','#64748b'];

start();
async function start(){
  try{
    DATA=await fetchFirst(['./summary.json','./data/summary.json']);
    initCore();
    try{
      GEO=await fetchFirst(['./data/housing_sample.geojson','./housing_sample.geojson']);
      initHousingLayer();
    }catch(e){
      console.warn('Poligon tidak dapat dimuatkan',e);
      $('mapStatus').textContent='Poligon tidak tersedia — statistik masih aktif';
    }
    update();
  }catch(e){
    console.error(e); showError('Data statistik gagal dimuatkan. Pastikan summary.json berada di root repository.');
  }finally{
    $('loadingScreen')?.classList.add('hidden');
  }
}
async function fetchFirst(paths){let last;for(const p of paths){try{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw new Error(`${p}: ${r.status}`);return await r.json()}catch(e){last=e}}throw last}
function showError(msg){document.body.insertAdjacentHTML('afterbegin',`<div class="error-banner">${msg}</div>`)}

function initCore(){
  populateFilters(); initMap(); initCharts(); bindUI();
  document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById(b.dataset.target)?.scrollIntoView({behavior:'smooth'});});
}
function populateFilters(){
  DATA.districts.slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(d=>$('districtFilter').add(new Option(d.name,d.code)));
  DATA.pbts.slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(p=>$('pbtFilter').add(new Option(p.name,p.code)));
  Object.keys(DATA.types).sort().forEach(t=>$('typeFilter').add(new Option(t,t)));
}
function refreshPbtFilter(){
  const district=$('districtFilter').value,current=$('pbtFilter').value;
  const allowed=new Set(DATA.rows.filter(r=>!district||r.district===district).map(r=>r.pbt));
  $('pbtFilter').innerHTML='<option value="">Semua PBT</option>';
  DATA.pbts.filter(p=>allowed.has(p.code)).sort((a,b)=>a.name.localeCompare(b.name)).forEach(p=>$('pbtFilter').add(new Option(p.name,p.code)));
  if(allowed.has(current))$('pbtFilter').value=current;
}
function bindUI(){
  $('districtFilter').addEventListener('change',()=>{refreshPbtFilter();update();zoomToFiltered();});
  ['pbtFilter','typeFilter'].forEach(id=>$(id).addEventListener('change',()=>{update();zoomToFiltered();}));
  $('resetBtn').onclick=()=>{['districtFilter','pbtFilter','typeFilter'].forEach(id=>$(id).value='');refreshPbtFilter();update();map.setView([3.15,101.52],9);};
  $('tableSearch').addEventListener('input',renderTable);
  $('polygonToggle').addEventListener('change',e=>{if(!housingLayer)return;e.target.checked?housingLayer.addTo(map):map.removeLayer(housingLayer)});
}
function filteredRows(){const d=$('districtFilter').value,p=$('pbtFilter').value,t=$('typeFilter').value;return DATA.rows.filter(r=>(!d||r.district===d)&&(!p||r.pbt===p)&&(!t||r.type===t));}
function aggregate(rows,key){const o={};rows.forEach(r=>o[r[key]]=(o[r[key]]||0)+r.count);return o}
function sum(rows,k){return rows.reduce((a,r)=>a+(+r[k]||0),0)}
function update(){
  if(!DATA)return;const rows=filteredRows(),total=sum(rows,'count'),area=sum(rows,'area');
  $('kpiRecords').textContent=fmt(total);$('kpiArea').textContent=fmtArea(area);$('kpiDistricts').textContent=new Set(rows.map(r=>r.district)).size;$('kpiPbts').textContent=new Set(rows.map(r=>r.pbt)).size;
  updateTypeChart(rows);updateDistrictChart(rows);updateSubtypeChart(rows);renderTable();updateHousingLayer();
}

function initMap(){
  map=L.map('map',{zoomControl:true,preferCanvas:true}).setView([3.15,101.52],9);
  const street=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
  const topo=L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'© OpenTopoMap'});
  L.control.layers({'Jalan':street,'Topo':topo},null,{position:'topright'}).addTo(map);
  const legend=L.control({position:'bottomright'});legend.onAdd=()=>{const d=L.DomUtil.create('div','map-legend');d.innerHTML='<b>Kategori</b>'+Object.entries(colors).filter(([k])=>k!=='Tidak Dinyatakan').map(([k,v])=>`<span><i style="background:${v}"></i>${k}</span>`).join('');return d};legend.addTo(map);
}
function featureMatches(f){const d=$('districtFilter').value,p=$('pbtFilter').value,t=$('typeFilter').value,x=f.properties;return(!d||x.district===d)&&(!p||x.pbt===p)&&(!t||x.housing_type===t)}
function polyStyle(f){const active=featureMatches(f);return{color:active?'#ffffff':'transparent',weight:active?.45:0,fillColor:colors[f.properties.housing_type]||'#64748b',fillOpacity:active?.68:0}}
function popupHtml(f){const p=f.properties;return `<div class="map-popup"><b>${p.housing_type}</b><span>${p.subtype}</span><hr><small>Daerah</small><strong>${p.district_name}</strong><small>PBT</small><strong>${p.pbt_name}</strong><small>Keluasan lot</small><strong>${fmtArea(p.area)} ha</strong>${p.lot?`<small>No. lot</small><strong>${p.lot}</strong>`:''}</div>`}
function initHousingLayer(){
  housingLayer=L.geoJSON(GEO,{renderer:L.canvas({padding:.5}),style:polyStyle,onEachFeature:(f,l)=>l.bindPopup(popupHtml(f),{maxWidth:300})}).addTo(map);
  $('mapStatus').textContent=`${fmt(GEO.features.length)} poligon sampel dipaparkan`;
  if(housingLayer.getBounds().isValid())map.fitBounds(housingLayer.getBounds(),{padding:[15,15],maxZoom:10});
}
function updateHousingLayer(){
  if(!housingLayer)return;let shown=0;housingLayer.eachLayer(l=>{const active=featureMatches(l.feature);l.setStyle(polyStyle(l.feature));if(active)shown++});
  $('mapStatus').textContent=`${fmt(shown)} daripada ${fmt(GEO.features.length)} poligon sampel sepadan penapis`;
}
function zoomToFiltered(){
  if(!housingLayer)return;const b=L.latLngBounds([]);housingLayer.eachLayer(l=>{if(featureMatches(l.feature)){const x=l.getBounds?.();if(x?.isValid())b.extend(x)}});if(b.isValid())map.fitBounds(b,{padding:[25,25],maxZoom:13});
}

function initCharts(){
  typeChart=new Chart($('typeChart'),{type:'doughnut',data:{labels:[],datasets:[{data:[],backgroundColor:palette,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{display:false}}}});
  districtChart=new Chart($('districtChart'),{type:'bar',data:{labels:[],datasets:[{data:[],backgroundColor:'#23395d',borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{grid:{color:'#eef1f6'},ticks:{font:{size:9}}},y:{grid:{display:false},ticks:{font:{size:9}}}}}});
  subtypeChart=new Chart($('subtypeChart'),{type:'bar',data:{labels:[],datasets:[{data:[],backgroundColor:'#f59e0b',borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{font:{size:9},maxRotation:45,minRotation:45}},y:{grid:{color:'#eef1f6'},ticks:{font:{size:9}}}}}});
}
function updateTypeChart(rows){const a=aggregate(rows,'type'),e=Object.entries(a).sort((x,y)=>y[1]-x[1]);typeChart.data.labels=e.map(x=>x[0]);typeChart.data.datasets[0].data=e.map(x=>x[1]);typeChart.data.datasets[0].backgroundColor=e.map(x=>colors[x[0]]||'#64748b');typeChart.update();const total=e.reduce((s,x)=>s+x[1],0)||1;$('typeLegend').innerHTML=e.map(x=>`<div class="legend-row"><span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors[x[0]]||'#64748b'};margin-right:7px"></i>${x[0]}</span><b>${(x[1]/total*100).toFixed(1)}%</b></div>`).join('')}
function updateDistrictChart(rows){const a=aggregate(rows,'district'),e=Object.entries(a).map(([k,v])=>[DATA.names.districts[k]||k,v]).sort((x,y)=>y[1]-x[1]);districtChart.data.labels=e.map(x=>x[0]);districtChart.data.datasets[0].data=e.map(x=>x[1]);districtChart.update()}
function updateSubtypeChart(rows){const a=aggregate(rows,'subtype'),e=Object.entries(a).sort((x,y)=>y[1]-x[1]).slice(0,10);subtypeChart.data.labels=e.map(x=>x[0].length>20?x[0].slice(0,18)+'…':x[0]);subtypeChart.data.datasets[0].data=e.map(x=>x[1]);subtypeChart.update()}
function renderTable(){const rows=filteredRows(),q=$('tableSearch').value.toLowerCase(),by={};rows.forEach(r=>{if(!by[r.pbt])by[r.pbt]={count:0,area:0};by[r.pbt].count+=r.count;by[r.pbt].area+=r.area});const total=Object.values(by).reduce((s,x)=>s+x.count,0)||1;const e=Object.entries(by).map(([code,v])=>({code,name:DATA.names.pbts[code]||code,...v})).filter(x=>x.name.toLowerCase().includes(q)||x.code.includes(q)).sort((a,b)=>b.count-a.count);$('pbtTable').innerHTML=e.map(x=>`<tr><td><b>${x.name}</b></td><td>${x.code}</td><td>${fmt(x.count)}</td><td>${fmtArea(x.area)}</td><td>${(x.count/total*100).toFixed(1)}%</td></tr>`).join('')||'<tr><td colspan="5">Tiada data untuk penapis semasa.</td></tr>'}
