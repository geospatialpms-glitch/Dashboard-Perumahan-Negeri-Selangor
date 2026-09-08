let DATA, typeChart, districtChart, subtypeChart, map, markers=[];
const $=id=>document.getElementById(id);
const fmt=n=>new Intl.NumberFormat('ms-MY').format(Math.round(n));
const fmtArea=n=>new Intl.NumberFormat('ms-MY',{maximumFractionDigits:1}).format(n);
const palette=['#f59e0b','#23395d','#4f7cac','#0ea5e9','#10b981','#8b5cf6','#ef4444','#64748b'];

fetch('data/summary.json').then(r=>r.json()).then(d=>{DATA=d;init();});

function init(){
  populateFilters(); initMap(); initCharts(); bindUI(); update();
  document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById(b.dataset.target)?.scrollIntoView({behavior:'smooth'});});
}
function populateFilters(){
  DATA.districts.slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(d=>$('districtFilter').add(new Option(d.name,d.code)));
  DATA.pbts.slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(p=>$('pbtFilter').add(new Option(p.name,p.code)));
  Object.keys(DATA.types).sort().forEach(t=>$('typeFilter').add(new Option(t,t)));
}
function bindUI(){
  ['districtFilter','pbtFilter','typeFilter'].forEach(id=>$(id).addEventListener('change',update));
  $('resetBtn').onclick=()=>{['districtFilter','pbtFilter','typeFilter'].forEach(id=>$(id).value='');update();};
  $('tableSearch').addEventListener('input',renderTable);
}
function filteredRows(){const d=$('districtFilter').value,p=$('pbtFilter').value,t=$('typeFilter').value;return DATA.rows.filter(r=>(!d||r.district===d)&&(!p||r.pbt===p)&&(!t||r.type===t));}
function aggregate(rows,key){const o={};rows.forEach(r=>{o[r[key]]=(o[r[key]]||0)+r.count});return o;}
function sum(rows,k){return rows.reduce((a,r)=>a+(+r[k]||0),0)}
function update(){
  const rows=filteredRows(), total=sum(rows,'count'), area=sum(rows,'area');
  $('kpiRecords').textContent=fmt(total); $('kpiArea').textContent=fmtArea(area); $('kpiDistricts').textContent=new Set(rows.map(r=>r.district)).size; $('kpiPbts').textContent=new Set(rows.map(r=>r.pbt)).size;
  updateTypeChart(rows); updateDistrictChart(rows); updateSubtypeChart(rows); updateMap(rows); renderTable();
}
function initMap(){
  map=L.map('map',{zoomControl:true}).setView([3.15,101.52],9);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(map);
}
function updateMap(rows){
  markers.forEach(m=>map.removeLayer(m)); markers=[]; const by=aggregate(rows,'district'); const max=Math.max(1,...Object.values(by));
  DATA.districts.forEach(d=>{const n=by[d.code]||0;if(!n)return;const radius=8+24*Math.sqrt(n/max);const m=L.circleMarker([d.lat,d.lon],{radius,weight:2,color:'#ffffff',fillColor:'#f59e0b',fillOpacity:.82}).addTo(map).bindPopup(`<b>${d.name}</b><br>${fmt(n)} rekod`);markers.push(m);});
}
function initCharts(){
  typeChart=new Chart($('typeChart'),{type:'doughnut',data:{labels:[],datasets:[{data:[],backgroundColor:palette,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{display:false}}}});
  districtChart=new Chart($('districtChart'),{type:'bar',data:{labels:[],datasets:[{data:[],backgroundColor:'#23395d',borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{grid:{color:'#eef1f6'},ticks:{font:{size:9}}},y:{grid:{display:false},ticks:{font:{size:9}}}}}});
  subtypeChart=new Chart($('subtypeChart'),{type:'bar',data:{labels:[],datasets:[{data:[],backgroundColor:'#f59e0b',borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{font:{size:9},maxRotation:45,minRotation:45}},y:{grid:{color:'#eef1f6'},ticks:{font:{size:9}}}}}});
}
function updateTypeChart(rows){const a=aggregate(rows,'type'),entries=Object.entries(a).sort((x,y)=>y[1]-x[1]);typeChart.data.labels=entries.map(x=>x[0]);typeChart.data.datasets[0].data=entries.map(x=>x[1]);typeChart.update();const total=entries.reduce((s,x)=>s+x[1],0)||1;$('typeLegend').innerHTML=entries.map((x,i)=>`<div class="legend-row"><span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${palette[i%palette.length]};margin-right:7px"></i>${x[0]}</span><b>${(x[1]/total*100).toFixed(1)}%</b></div>`).join('');}
function updateDistrictChart(rows){const a=aggregate(rows,'district');const e=Object.entries(a).map(([k,v])=>[DATA.names.districts[k]||k,v]).sort((x,y)=>y[1]-x[1]);districtChart.data.labels=e.map(x=>x[0]);districtChart.data.datasets[0].data=e.map(x=>x[1]);districtChart.update();}
function updateSubtypeChart(rows){const a=aggregate(rows,'subtype');const e=Object.entries(a).sort((x,y)=>y[1]-x[1]).slice(0,10);subtypeChart.data.labels=e.map(x=>x[0].length>20?x[0].slice(0,18)+'…':x[0]);subtypeChart.data.datasets[0].data=e.map(x=>x[1]);subtypeChart.update();}
function renderTable(){const rows=filteredRows(), q=$('tableSearch').value.toLowerCase();const by={};rows.forEach(r=>{if(!by[r.pbt])by[r.pbt]={count:0,area:0};by[r.pbt].count+=r.count;by[r.pbt].area+=r.area});const total=Object.values(by).reduce((s,x)=>s+x.count,0)||1;const e=Object.entries(by).map(([code,v])=>({code,name:DATA.names.pbts[code]||code,...v})).filter(x=>x.name.toLowerCase().includes(q)||x.code.includes(q)).sort((a,b)=>b.count-a.count);$('pbtTable').innerHTML=e.map(x=>`<tr><td><b>${x.name}</b></td><td>${x.code}</td><td>${fmt(x.count)}</td><td>${fmtArea(x.area)}</td><td>${(x.count/total*100).toFixed(1)}%</td></tr>`).join('')||'<tr><td colspan="5">Tiada data untuk penapis semasa.</td></tr>';}
