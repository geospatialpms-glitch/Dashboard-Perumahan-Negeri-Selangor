let DATA, MANIFEST, map, typeChart, districtChart, subtypeChart;
let currentMode='overview', loadedPbt='', requestToken=0, activeSources=[];
const $=id=>document.getElementById(id);
const fmt=n=>new Intl.NumberFormat('ms-MY').format(Math.round(n));
const fmtArea=n=>new Intl.NumberFormat('ms-MY',{maximumFractionDigits:1}).format(n);
const COLORS={'Perumahan Bukan Strata':'#f59e0b','Perumahan Strata':'#2563eb','Kampung':'#16a34a','Setinggan':'#dc2626','Tidak Dinyatakan':'#64748b'};
const PALETTE=['#f59e0b','#2563eb','#16a34a','#dc2626','#8b5cf6','#0ea5e9','#64748b'];
const CHUNK_CACHE=new Map();
window.__registerHousingChunk=(key,index,data)=>CHUNK_CACHE.set(`${key}:${index}`,data);

start();
function start(){
  try{
    DATA=window.DASHBOARD_DATA; MANIFEST=window.DASHBOARD_MANIFEST;
    if(!DATA?.rows||!MANIFEST?.pbts) throw new Error('data-inline.js tidak lengkap');
    populateFilters(); initCharts(); bindUI(); initMap(); update();
  }catch(e){console.error(e);showError('Dashboard gagal dimulakan. Pastikan data-inline.js, app.js dan data-pack ZIP berada di root repository.');}
  finally{$('loadingScreen')?.classList.add('hidden')}
}
function showError(msg){$('errorBanner').textContent=msg;$('errorBanner').classList.remove('hidden')}
function clearError(){$('errorBanner').classList.add('hidden')}
function populateFilters(){DATA.districts.slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(d=>$('districtFilter').add(new Option(d.name,d.code)));DATA.pbts.slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(p=>$('pbtFilter').add(new Option(p.name,p.code)));Object.keys(DATA.types).sort().forEach(t=>$('typeFilter').add(new Option(t,t)))}
function refreshPbtFilter(){const d=$('districtFilter').value,current=$('pbtFilter').value;const allowed=new Set(DATA.rows.filter(r=>!d||r.district===d).map(r=>r.pbt));$('pbtFilter').innerHTML='<option value="">Semua PBT</option>';DATA.pbts.filter(p=>allowed.has(p.code)).sort((a,b)=>a.name.localeCompare(b.name)).forEach(p=>$('pbtFilter').add(new Option(p.name,p.code)));if(allowed.has(current))$('pbtFilter').value=current}
function bindUI(){$('districtFilter').addEventListener('change',async()=>{refreshPbtFilter();update();await syncMapMode()});$('pbtFilter').addEventListener('change',async()=>{update();await syncMapMode()});$('typeFilter').addEventListener('change',()=>{update();applyMapFilter()});$('resetBtn').onclick=async()=>{['districtFilter','pbtFilter','typeFilter'].forEach(id=>$(id).value='');refreshPbtFilter();update();await loadOverview(true)};$('reloadFullBtn').onclick=()=>{const p=$('pbtFilter').value;if(p)loadFullPbt(p,true)};$('polygonToggle').addEventListener('change',applyVisibility);$('tableSearch').addEventListener('input',renderTable);document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById(b.dataset.target)?.scrollIntoView({behavior:'smooth'})})}
function filteredRows(){const d=$('districtFilter').value,p=$('pbtFilter').value,t=$('typeFilter').value;return DATA.rows.filter(r=>(!d||r.district===d)&&(!p||r.pbt===p)&&(!t||r.type===t))}
function sum(rows,k){return rows.reduce((a,r)=>a+(+r[k]||0),0)}
function aggregate(rows,key){const o={};rows.forEach(r=>o[r[key]]=(o[r[key]]||0)+r.count);return o}
function update(){const rows=filteredRows();$('kpiRecords').textContent=fmt(sum(rows,'count'));$('kpiArea').textContent=fmtArea(sum(rows,'area'));$('kpiDistricts').textContent=new Set(rows.map(r=>r.district)).size;$('kpiPbts').textContent=new Set(rows.map(r=>r.pbt)).size;updateTypeChart(rows);updateDistrictChart(rows);updateSubtypeChart(rows);renderTable()}
function initMap(){map=new maplibregl.Map({container:'map',center:[101.52,3.15],zoom:8.5,minZoom:6,maxZoom:19,hash:false,attributionControl:true,style:{version:8,sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap contributors'}},layers:[{id:'osm',type:'raster',source:'osm'}]}});map.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'top-right');map.addControl(new maplibregl.FullscreenControl(),'top-right');map.on('load',()=>loadOverview(false))}
function esc(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function showPopup(f,lngLat){const p=f.properties||{};const d=DATA.names.districts[p.district]||p.district||'-',pb=DATA.names.pbts[p.pbt]||p.pbt||'-';new maplibregl.Popup({maxWidth:'330px'}).setLngLat(lngLat).setHTML(`<div class="map-popup"><b>${esc(p.type||'-')}</b><span>${esc(p.subtype||'-')}</span><hr><small>Daerah</small><strong>${esc(d)}</strong><small>PBT</small><strong>${esc(pb)}</strong><small>Keluasan lot</small><strong>${fmtArea(+p.area||0)} ha</strong>${p.lot?`<small>No. lot</small><strong>${esc(p.lot)}</strong>`:''}</div>`).addTo(map)}
function removeActiveSources(){for(const x of activeSources.slice().reverse()){if(map.getLayer(x.line))map.removeLayer(x.line);if(map.getLayer(x.fill))map.removeLayer(x.fill);if(map.getSource(x.source))map.removeSource(x.source)}activeSources=[]}
function addChunkSource(key,index,geo){const safe=String(key).replace(/[^a-zA-Z0-9_-]/g,'_');const source=`housing-${safe}-${index}`,fill=`${source}-fill`,line=`${source}-line`;map.addSource(source,{type:'geojson',data:geo});map.addLayer({id:fill,type:'fill',source,paint:{'fill-color':['match',['get','type'],'Perumahan Bukan Strata',COLORS['Perumahan Bukan Strata'],'Perumahan Strata',COLORS['Perumahan Strata'],'Kampung',COLORS.Kampung,'Setinggan',COLORS.Setinggan,'#64748b'],'fill-opacity':['interpolate',['linear'],['zoom'],7,0.42,12,0.62,16,0.74]}});map.addLayer({id:line,type:'line',source,minzoom:12,paint:{'line-color':'#ffffff','line-width':['interpolate',['linear'],['zoom'],12,0.15,17,0.65],'line-opacity':0.75}});map.on('click',fill,e=>{if(e.features?.length)showPopup(e.features[0],e.lngLat)});map.on('mouseenter',fill,()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave',fill,()=>map.getCanvas().style.cursor='');activeSources.push({source,fill,line});applyFilterTo(fill,line);applyVisibility()}
const PACK_CACHE=new Map();
async function getPack(packName){
  if(PACK_CACHE.has(packName)) return PACK_CACHE.get(packName);
  if(typeof JSZip==='undefined') throw new Error('Enjin ZIP gagal dimuatkan. Semak sambungan internet/CDN.');
  const promise=(async()=>{
    const r=await fetch('./'+packName,{cache:'force-cache'});
    if(!r.ok) throw new Error(`Fail data tidak ditemui: ${packName} (HTTP ${r.status})`);
    const buf=await r.arrayBuffer();
    return JSZip.loadAsync(buf);
  })();
  PACK_CACHE.set(packName,promise);
  try{return await promise}catch(e){PACK_CACHE.delete(packName);throw e}
}
async function loadScript(url,key,index,token){
  const cacheKey=`${key}:${index}`;
  if(CHUNK_CACHE.has(cacheKey)) return CHUNK_CACHE.get(cacheKey);
  const path=String(url).replace(/^\.\//,'');
  const packName=window.DASHBOARD_PACK_INDEX?.[path];
  if(!packName) throw new Error(`Indeks data tiada untuk: ${path}`);
  const zip=await getPack(packName);
  if(token!==requestToken) return null;
  const entry=zip.file(path);
  if(!entry) throw new Error(`Fail ${path} tiada dalam ${packName}`);
  const code=await entry.async('string');
  if(token!==requestToken) return null;
  try{(0,eval)(code)}catch(e){throw new Error(`Data rosak pada ${path}: ${e.message}`)}
  const data=CHUNK_CACHE.get(cacheKey);
  if(!data) throw new Error(`Chunk tidak mendaftar: ${path}`);
  return data;
}
async function loadChunkSet(key,meta,token){removeActiveSources();let loaded=0,total=meta.chunks.reduce((s,c)=>s+c.records,0);for(let i=0;i<meta.chunks.length;i++){if(token!==requestToken)return false;const c=meta.chunks[i];$('mapStatus').textContent=`Memuatkan ${meta.name||'overview'}: ${i+1}/${meta.chunks.length} chunk · ${fmt(loaded)}/${fmt(total)} lot`;const geo=await loadScript('./'+c.file,key,i,token);if(!geo||token!==requestToken)return false;addChunkSource(key,i,geo);loaded+=c.records;$('mapProgressBar').style.width=`${Math.max(5,Math.round((i+1)/meta.chunks.length*100))}%`;await new Promise(r=>setTimeout(r,0))}return true}
async function syncMapMode(){const p=$('pbtFilter').value;if(p)await loadFullPbt(p,false);else await loadOverview(true)}
async function loadOverview(fit){const token=++requestToken;clearError();setMapLoading(true,'Memuatkan overview…');$('reloadFullBtn').disabled=true;try{const meta={name:'Overview Negeri',chunks:MANIFEST.overview.chunks};const ok=await loadChunkSet('overview',meta,token);if(!ok)return;currentMode='overview';loadedPbt='';$('mapMode').textContent='OVERVIEW NEGERI';$('mapStatus').textContent=`${fmt(MANIFEST.overview_records)} poligon berstrata · pilih satu PBT untuk semua lot`;if(fit)map.fitBounds([[100.75,2.55],[102.05,3.9]],{padding:30,duration:700})}catch(e){console.error(e);showError(`Overview gagal dimuatkan: ${e.message}`)}finally{if(token===requestToken)setMapLoading(false)}}
async function loadFullPbt(code,force){if(!force&&currentMode==='full'&&loadedPbt===code){applyMapFilter();fitPbt(code);return}const meta=MANIFEST.pbts[code];if(!meta)return;const token=++requestToken;clearError();$('reloadFullBtn').disabled=true;setMapLoading(true,`Memuatkan ${meta.name}…`);try{const ok=await loadChunkSet(code,meta,token);if(!ok)return;currentMode='full';loadedPbt=code;applyMapFilter();fitPbt(code);$('mapMode').textContent='LOT PENUH PBT';$('mapStatus').textContent=`${fmt(meta.records)} / ${fmt(meta.records)} poligon ${meta.name} dimuatkan dalam ${meta.chunks.length} chunk`;$('reloadFullBtn').disabled=false}catch(e){console.error(e);showError(`${meta.name} gagal pada fail chunk. ${e.message}`);$('mapStatus').textContent='Gagal memuatkan data — pastikan semua fail data-pack-*.zip berada di root repository.';$('reloadFullBtn').disabled=false}finally{if(token===requestToken)setMapLoading(false)}}
function applyFilterTo(fill,line){const t=$('typeFilter').value,d=$('districtFilter').value,p=$('pbtFilter').value,parts=[];if(t)parts.push(['==',['get','type'],t]);if(d)parts.push(['==',['get','district'],d]);if(p&&currentMode!=='full')parts.push(['==',['get','pbt'],p]);const f=parts.length===0?null:parts.length===1?parts[0]:['all',...parts];if(map.getLayer(fill))map.setFilter(fill,f);if(map.getLayer(line))map.setFilter(line,f)}
function applyMapFilter(){for(const x of activeSources)applyFilterTo(x.fill,x.line);applyVisibility()}
function applyVisibility(){const v=$('polygonToggle').checked?'visible':'none';for(const x of activeSources){if(map.getLayer(x.fill))map.setLayoutProperty(x.fill,'visibility',v);if(map.getLayer(x.line))map.setLayoutProperty(x.line,'visibility',v)}}
function fitPbt(code){const b=MANIFEST.pbts[code]?.bounds;if(b)map.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:45,maxZoom:13,duration:700})}
function setMapLoading(on,text=''){const w=$('mapProgress');w.classList.toggle('hidden',!on);if(!on)$('mapProgressBar').style.width='0%';if(text)$('mapStatus').textContent=text}
function initCharts(){typeChart=new Chart($('typeChart'),{type:'doughnut',data:{labels:[],datasets:[{data:[],backgroundColor:PALETTE,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{display:false}}}});districtChart=new Chart($('districtChart'),{type:'bar',data:{labels:[],datasets:[{data:[],backgroundColor:'#23395d',borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{grid:{color:'#eef1f6'},ticks:{font:{size:9}}},y:{grid:{display:false},ticks:{font:{size:9}}}}}});subtypeChart=new Chart($('subtypeChart'),{type:'bar',data:{labels:[],datasets:[{data:[],backgroundColor:'#f59e0b',borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{font:{size:9},maxRotation:45,minRotation:45}},y:{grid:{color:'#eef1f6'},ticks:{font:{size:9}}}}}})}
function updateTypeChart(rows){const a=aggregate(rows,'type'),e=Object.entries(a).sort((x,y)=>y[1]-x[1]);typeChart.data.labels=e.map(x=>x[0]);typeChart.data.datasets[0].data=e.map(x=>x[1]);typeChart.data.datasets[0].backgroundColor=e.map(x=>COLORS[x[0]]||'#64748b');typeChart.update();const total=e.reduce((s,x)=>s+x[1],0)||1;$('typeLegend').innerHTML=e.map(x=>`<div class="legend-row"><span><i style="background:${COLORS[x[0]]||'#64748b'}"></i>${x[0]}</span><b>${(x[1]/total*100).toFixed(1)}%</b></div>`).join('')}
function updateDistrictChart(rows){const a=aggregate(rows,'district'),e=Object.entries(a).map(([k,v])=>[DATA.names.districts[k]||k,v]).sort((x,y)=>y[1]-x[1]);districtChart.data.labels=e.map(x=>x[0]);districtChart.data.datasets[0].data=e.map(x=>x[1]);districtChart.update()}
function updateSubtypeChart(rows){const a=aggregate(rows,'subtype'),e=Object.entries(a).sort((x,y)=>y[1]-x[1]).slice(0,10);subtypeChart.data.labels=e.map(x=>x[0].length>20?x[0].slice(0,18)+'…':x[0]);subtypeChart.data.datasets[0].data=e.map(x=>x[1]);subtypeChart.update()}
function renderTable(){const rows=filteredRows(),q=$('tableSearch').value.toLowerCase(),by={};rows.forEach(r=>{if(!by[r.pbt])by[r.pbt]={count:0,area:0};by[r.pbt].count+=r.count;by[r.pbt].area+=r.area});const total=Object.values(by).reduce((s,x)=>s+x.count,0)||1;const e=Object.entries(by).map(([code,v])=>({code,name:DATA.names.pbts[code]||code,...v})).filter(x=>x.name.toLowerCase().includes(q)||x.code.includes(q)).sort((a,b)=>b.count-a.count);$('pbtTable').innerHTML=e.map(x=>`<tr><td><b>${x.name}</b></td><td>${x.code}</td><td>${fmt(x.count)}</td><td>${fmtArea(x.area)}</td><td>${(x.count/total*100).toFixed(1)}%</td><td><button class="table-map-btn" data-pbt="${x.code}">Buka peta</button></td></tr>`).join('')||'<tr><td colspan="6">Tiada data untuk penapis semasa.</td></tr>';document.querySelectorAll('.table-map-btn').forEach(b=>b.onclick=async()=>{$('pbtFilter').value=b.dataset.pbt;const row=DATA.rows.find(r=>r.pbt===b.dataset.pbt);if(row){$('districtFilter').value=row.district;refreshPbtFilter();$('pbtFilter').value=b.dataset.pbt}update();document.getElementById('map-section').scrollIntoView({behavior:'smooth'});await loadFullPbt(b.dataset.pbt,false)})}
