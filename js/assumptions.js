
const ASSUMPTION_DEFINITIONS = [
  {key:'wrapper_grams_per_momo', label:'Wrapper dough per momo', category:'Momo', numeric_value:13, unit:'g', notes:'Default wrapper dough used per momo piece.'},
  {key:'chutney_cup_grams', label:'Chutney per cup/box', category:'Chutney', numeric_value:35, unit:'g', notes:'Standard chutney quantity in one chutney box.'},
  {key:'momo_6_red_chutney_cups', label:'6 pcs Red Chilli cups', category:'Chutney', numeric_value:1, unit:'cup', notes:'Red chutney cups for 6 pcs.'},
  {key:'momo_6_mayo_cups', label:'6 pcs Mayo cups', category:'Chutney', numeric_value:1, unit:'cup', notes:'Mayo cups for 6 pcs.'},
  {key:'momo_6_nepali_cups', label:'6 pcs Nepali cups', category:'Chutney', numeric_value:1, unit:'cup', notes:'Nepali chutney cups for 6 pcs.'},
  {key:'momo_10_red_chutney_cups', label:'10 pcs Red Chilli cups', category:'Chutney', numeric_value:2, unit:'cup', notes:'Red chutney cups for 10 pcs.'},
  {key:'momo_10_mayo_cups', label:'10 pcs Mayo cups', category:'Chutney', numeric_value:2, unit:'cup', notes:'Mayo cups for 10 pcs.'},
  {key:'momo_10_nepali_cups', label:'10 pcs Nepali cups', category:'Chutney', numeric_value:2, unit:'cup', notes:'Nepali chutney cups for 10 pcs.'},
  {key:'momo_12_red_chutney_cups', label:'12 pcs Red Chilli cups', category:'Chutney', numeric_value:2, unit:'cup', notes:'Red chutney cups for 12 pcs.'},
  {key:'momo_12_mayo_cups', label:'12 pcs Mayo cups', category:'Chutney', numeric_value:2, unit:'cup', notes:'Mayo cups for 12 pcs.'},
  {key:'momo_12_nepali_cups', label:'12 pcs Nepali cups', category:'Chutney', numeric_value:2, unit:'cup', notes:'Nepali chutney cups for 12 pcs.'},
  {key:'momo_6_main_box_count', label:'6 pcs main boxes', category:'Packaging', numeric_value:1, unit:'box', notes:'Main momo boxes for 6 pcs packaging set.'},
  {key:'momo_6_chutney_box_count', label:'6 pcs chutney boxes', category:'Packaging', numeric_value:3, unit:'box', notes:'Chutney boxes for 6 pcs.'},
  {key:'momo_10_main_box_count', label:'10 pcs main boxes', category:'Packaging', numeric_value:2, unit:'box', notes:'Main momo boxes for 10 pcs.'},
  {key:'momo_10_chutney_box_count', label:'10 pcs chutney boxes', category:'Packaging', numeric_value:6, unit:'box', notes:'Chutney boxes for 10 pcs.'},
  {key:'momo_12_main_box_count', label:'12 pcs main boxes', category:'Packaging', numeric_value:2, unit:'box', notes:'Main momo boxes for 12 pcs.'},
  {key:'momo_12_chutney_box_count', label:'12 pcs chutney boxes', category:'Packaging', numeric_value:6, unit:'box', notes:'Chutney boxes for 12 pcs.'},
  {key:'momo_steam_cost_per_order', label:'Steam / gas cost per order', category:'Cooking', numeric_value:2, unit:'₹', notes:'Optional default steam/gas cost per sellable momo order.'},
  {key:'momo_fry_cost_per_order', label:'Fry oil/gas cost per order', category:'Cooking', numeric_value:5, unit:'₹', notes:'Optional default frying cost for fried/kurkure momo orders.'}
];
function assumptionRecord(key){ return (state.assumptions||[]).find(a=>String(a.key||'')===String(key)); }
function assumptionValue(key, fallback=0){ const hit=assumptionRecord(key); if(hit && hit.numeric_value!==null && hit.numeric_value!==undefined) return num(hit.numeric_value); const def=ASSUMPTION_DEFINITIONS.find(x=>x.key===key); return def ? num(def.numeric_value) : fallback; }
function assumptionText(key, fallback=''){ const hit=assumptionRecord(key); return hit?.text_value || fallback; }
function assumptionDefRows(){ return ASSUMPTION_DEFINITIONS.map((d,idx)=>({sort_order:(idx+1)*10, active:true, ...d})); }
async function seedDefaultAssumptions(){
  let inserted=0, updated=0;
  for(const d of assumptionDefRows()){
    const existing=assumptionRecord(d.key);
    const row={key:d.key,label:d.label,category:d.category,numeric_value:d.numeric_value,text_value:d.text_value||'',unit:d.unit,notes:d.notes,sort_order:d.sort_order,active:true,updated_at:new Date().toISOString()};
    const saved=existing ? await dbUpdate('assumptions', existing.id, row) : await dbInsert('assumptions', row);
    if(saved) existing ? updated++ : inserted++;
  }
  showToast(`Assumptions seeded. ${inserted} added, ${updated} updated.`);
  await refreshAll(false); renderAssumptions(); if(typeof renderProducts==='function') renderProducts();
}
async function saveAllAssumptions(){
  let savedCount=0;
  for(const d of assumptionDefRows()){
    const numeric_value=num(val(`assumption_${d.key}`));
    const unit=val(`assumption_unit_${d.key}`) || d.unit || '';
    const existing=assumptionRecord(d.key);
    const row={key:d.key,label:d.label,category:d.category,numeric_value,text_value:'',unit,notes:d.notes,sort_order:d.sort_order,active:true,updated_at:new Date().toISOString()};
    const saved=existing ? await dbUpdate('assumptions', existing.id, row) : await dbInsert('assumptions', row);
    if(saved) savedCount++;
  }
  showToast(`${savedCount} assumption(s) saved.`);
  await refreshAll(false); renderAssumptions(); if(typeof renderProducts==='function') renderProducts();
}
function renderAssumptions(){
  const grid=byId('assumptionFormGrid');
  if(grid){
    grid.innerHTML=ASSUMPTION_DEFINITIONS.map(d=>{
      const value=assumptionValue(d.key, d.numeric_value);
      const unit=assumptionRecord(d.key)?.unit || d.unit || '';
      return `<div><label>${escapeHtml(d.label)}</label><div class="recipe-input-group"><input id="assumption_${escapeHtml(d.key)}" type="number" value="${escapeHtml(value)}"><input id="assumption_unit_${escapeHtml(d.key)}" value="${escapeHtml(unit)}" placeholder="Unit"></div><small class="muted">${escapeHtml(d.notes||'')}</small></div>`;
    }).join('');
  }
  const target=byId('assumptionsTable');
  if(target){
    const rows=(state.assumptions&&state.assumptions.length?state.assumptions:assumptionDefRows()).slice().sort((a,b)=>(num(a.sort_order)-num(b.sort_order)) || String(a.key).localeCompare(String(b.key))).map(a=>`<tr><td><strong>${escapeHtml(a.label||a.key)}</strong><br><span class="small">${escapeHtml(a.key||'')}</span></td><td>${escapeHtml(a.category||'')}</td><td>${num(a.numeric_value)}</td><td>${escapeHtml(a.unit||'')}</td><td>${expandableNote(a.notes||'',60)}</td></tr>`);
    target.innerHTML=table(['Assumption','Category','Value','Unit','Notes'], rows);
  }
}
