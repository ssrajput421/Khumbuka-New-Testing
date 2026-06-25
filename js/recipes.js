/* Khumbuka V1.5 Recipe Master
   Batch recipe costing with direct quantity and % of main ingredient modes.
   This file intentionally owns the Recipes page UI so the patch does not need to replace index.html. */

let recipeMasterSelectedId = null;
let recipeMasterNewMode = false;
let recipeMasterDraft = {};
function recipePositiveNum(v){ return Math.max(0, recipeNum(v)); }

function injectRecipeMasterStyles(){
  if(document.getElementById('recipeMasterStyles')) return;
  const style=document.createElement('style');
  style.id='recipeMasterStyles';
  style.textContent=`
  .recipe-master-page{display:flex;flex-direction:column;gap:16px;}
  .recipe-page-title{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:2px;}
  .recipe-page-title h1{margin:0;font-size:32px;letter-spacing:.02em;color:#0f172a;font-weight:800;}
  .recipe-page-title p{margin:6px 0 0;color:#64748b;font-size:15px;}
  .recipe-top-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
  .recipe-command-search{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:8px 10px;box-shadow:0 8px 22px rgba(15,23,42,.04);min-width:240px;}
  .recipe-command-search input{border:0;outline:0;width:100%;font-size:14px;background:transparent;}
  .recipe-kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;}
  .recipe-kpi-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:18px 20px;box-shadow:0 10px 30px rgba(15,23,42,.05);display:flex;align-items:center;gap:16px;min-height:90px;}
  .recipe-kpi-icon{width:48px;height:48px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:24px;background:#eff6ff;color:#2563eb;}
  .recipe-kpi-icon.green{background:#dcfce7;color:#16a34a}.recipe-kpi-icon.purple{background:#f3e8ff;color:#7c3aed}.recipe-kpi-icon.orange{background:#fff7ed;color:#ea580c}
  .recipe-kpi-card span{display:block;color:#64748b;font-size:13px;font-weight:600}.recipe-kpi-card strong{display:block;color:#0f172a;font-size:22px;font-weight:800;line-height:1.1;margin-top:2px}.recipe-kpi-card small{display:block;color:#94a3b8;margin-top:5px;font-size:12px;}
  .recipe-workspace{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:14px;align-items:start;}
  .recipe-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,.05);overflow:hidden;}
  .recipe-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #edf2f7;background:#fff;}
  .recipe-card-head h3{margin:0;font-size:16px;font-weight:800;color:#0f172a}.recipe-card-head p{margin:3px 0 0;color:#64748b;font-size:13px;}
  .recipe-card-body{padding:16px;}
  .recipe-form-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;}
  .recipe-form-grid.three{grid-template-columns:repeat(3,minmax(0,1fr));}
  .recipe-form-grid.two{grid-template-columns:repeat(2,minmax(0,1fr));}
  .recipe-field label{display:block;font-size:12px;text-transform:none;letter-spacing:.02em;color:#334155;font-weight:800;margin-bottom:7px;}
  .recipe-field label b{color:#ef4444}.recipe-field input,.recipe-field select,.recipe-field textarea{width:100%;border:1px solid #dbe3ef;border-radius:11px;background:#fff;padding:11px 12px;font-size:14px;color:#0f172a;outline:none;transition:.15s ease;}
  .recipe-field input:focus,.recipe-field select:focus,.recipe-field textarea:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.10)}
  .recipe-field input[readonly]{background:#f8fafc;color:#64748b;cursor:not-allowed;border-style:dashed;}
  .recipe-input-group{display:flex;align-items:stretch}.recipe-input-group input{border-radius:11px 0 0 11px}.recipe-input-group select,.recipe-input-group span{border:1px solid #dbe3ef;border-left:0;border-radius:0 11px 11px 0;background:#f8fafc;padding:0 12px;display:flex;align-items:center;color:#334155;font-weight:700;min-width:70px;}
  .recipe-textarea{grid-column:1/-1}.recipe-textarea textarea{min-height:52px;resize:vertical;}
  .recipe-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 14px;border-bottom:1px solid #e5e7eb;background:#fbfdff;}
  .recipe-toolbar .spacer{flex:1}.recipe-btn{border:1px solid #dbe3ef;border-radius:10px;background:#fff;color:#334155;font-weight:800;font-size:13px;padding:10px 13px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:.15s ease;text-decoration:none;}
  .recipe-btn:hover{transform:translateY(-1px);box-shadow:0 8px 18px rgba(15,23,42,.08)}.recipe-btn.primary{background:#2563eb;color:#fff;border-color:#2563eb}.recipe-btn.success{background:#16a34a;color:#fff;border-color:#16a34a}.recipe-btn.danger{background:#dc2626;color:#fff;border-color:#dc2626}.recipe-btn.ghost{background:#f8fafc}.recipe-btn.small{font-size:12px;padding:7px 9px;border-radius:8px;}
  .recipe-table-wrap{overflow:auto;max-width:100%;}.recipe-master-table{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;min-width:980px;}
  .recipe-master-table th{position:sticky;top:0;background:#f8fafc;border-bottom:1px solid #dbe3ef;border-right:1px solid #e5e7eb;color:#334155;text-transform:uppercase;letter-spacing:.04em;font-size:11px;font-weight:900;padding:10px 12px;text-align:left;white-space:nowrap;}
  .recipe-master-table td{border-bottom:1px solid #edf2f7;border-right:1px solid #edf2f7;padding:8px 12px;color:#0f172a;vertical-align:middle;background:#fff;}
  .recipe-master-table tr:nth-child(even) td{background:#fbfdff}.recipe-master-table tr:hover td{background:#f8fafc}.recipe-master-table td.num,.recipe-master-table th.num{text-align:right;font-variant-numeric:tabular-nums}.recipe-master-table tfoot td{background:#fff!important;font-weight:900;border-top:1px solid #dbe3ef;}
  .recipe-inline-input{width:92px;border:1px solid #e2e8f0;border-radius:8px;padding:6px 7px;font-size:13px;text-align:right;background:#fff;}.recipe-inline-select{min-width:74px;border:1px solid #e2e8f0;border-radius:8px;padding:6px 7px;font-size:13px;background:#fff;}.recipe-inline-name{min-width:170px;text-align:left;}
  .recipe-empty{padding:32px;text-align:center;color:#64748b;background:#f8fafc;border-radius:14px;margin:12px;}
  .recipe-side-stack{display:flex;flex-direction:column;gap:14px;position:sticky;top:12px;}
  .recipe-output-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,.05);padding:16px;}
  .recipe-output-card h3{margin:0 0 12px;font-size:16px;color:#0f172a;font-weight:900}.recipe-output-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:7px 0;border-bottom:1px dashed #e2e8f0;}
  .recipe-output-row:last-child{border-bottom:0}.recipe-output-row span{color:#475569;font-size:13px}.recipe-output-row strong{color:#0f172a;font-size:13px;text-align:right;font-variant-numeric:tabular-nums}.recipe-output-row strong.green{color:#15803d}.recipe-output-row strong.blue{color:#2563eb}.recipe-output-row.group{border-top:1px solid #e5e7eb;margin-top:5px;padding-top:10px;}
  .linked-product-pill{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid #dbeafe;background:#f8fbff;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:13px;}.linked-product-pill small{background:#dcfce7;color:#166534;border-radius:999px;padding:3px 8px;font-weight:800}.linked-product-pill button{border:0;background:transparent;color:#64748b;cursor:pointer;font-weight:900;}
  .recipe-data-health-strip{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:12px 14px;box-shadow:0 10px 30px rgba(15,23,42,.04);}
  .recipe-health-title{font-weight:900;color:#0f172a;margin-right:6px}.recipe-warning-chip{display:inline-flex;align-items:center;gap:6px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:800;}.recipe-info-chip{display:inline-flex;align-items:center;gap:6px;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:800;}
  .recipe-list-grid{display:grid;grid-template-columns:320px 1fr;gap:14px;}.recipe-list-panel{max-height:560px;overflow:auto;}.recipe-list-item{display:block;width:100%;text-align:left;border:1px solid #e5e7eb;background:#fff;border-radius:12px;padding:12px;margin-bottom:8px;cursor:pointer;}.recipe-list-item.active{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.10)}.recipe-list-item strong{display:block;color:#0f172a}.recipe-list-item small{color:#64748b;display:block;margin-top:4px}
  .recipe-status-pill{display:inline-flex;align-items:center;border-radius:999px;padding:4px 9px;background:#dcfce7;color:#166534;font-size:12px;font-weight:900}.recipe-status-pill.inactive{background:#f1f5f9;color:#64748b}
  .recipe-hidden-file{display:none!important}.recipe-actions-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:14px;}
  .recipe-bulk-bar{display:flex;align-items:end;gap:10px;flex-wrap:wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;margin:12px 14px;padding:12px;}
  .recipe-bulk-bar.hidden{display:none!important}.recipe-bulk-bar label{display:block;font-size:11px;color:#64748b;font-weight:900;margin-bottom:5px}.recipe-bulk-count{font-weight:900;color:#0f172a;padding:9px 11px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;}
  .recipe-row-drag-handle{cursor:grab;color:#64748b;font-size:16px;user-select:none}.recipe-row-dragging td{opacity:.55}.recipe-row-drop-target td{box-shadow:inset 0 2px 0 #2563eb;}
  @media (max-width:1200px){.recipe-workspace{grid-template-columns:1fr}.recipe-side-stack{position:static}.recipe-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.recipe-form-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
  @media (max-width:720px){.recipe-page-title{flex-direction:column}.recipe-page-title h1{font-size:26px}.recipe-kpi-grid{grid-template-columns:1fr}.recipe-form-grid,.recipe-form-grid.three,.recipe-form-grid.two{grid-template-columns:1fr}.recipe-list-grid{grid-template-columns:1fr}.recipe-card-body{padding:12px}.recipe-toolbar{align-items:stretch}.recipe-btn{justify-content:center}.recipe-command-search{width:100%;min-width:0}.recipe-master-table{min-width:920px}.recipe-output-card{padding:14px}}
  `;
  document.head.appendChild(style);
}

function recipeSafeUnit(unit){ return String(unit||'').trim(); }
function recipeUnitFamily(unit){ return typeof unitFamily === 'function' ? unitFamily(unit) : recipeSafeUnit(unit).toLowerCase(); }
function recipeMoney(n){ return typeof money === 'function' ? money(n) : `₹${(Number(n)||0).toFixed(2)}`; }
function recipeNum(v){ return typeof num === 'function' ? num(v) : Number(String(v??'').replace(/,/g,''))||0; }
function recipeEscape(s){ return typeof escapeHtml === 'function' ? escapeHtml(s) : String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function recipeVal(id){ return document.getElementById(id)?.value ?? ''; }
function recipeSetVal(id,v){ const el=document.getElementById(id); if(el) el.value = v ?? ''; }
function recipeById(id){ return document.getElementById(id); }

function recipeSnapshotFocus(){
  const el=document.activeElement;
  if(!el || !el.id || !el.closest?.('#recipes')) return null;
  const tag=String(el.tagName||'').toLowerCase();
  if(!['input','textarea','select'].includes(tag)) return null;
  return {
    id: el.id,
    tag,
    value: el.value,
    start: typeof el.selectionStart==='number' ? el.selectionStart : null,
    end: typeof el.selectionEnd==='number' ? el.selectionEnd : null
  };
}
function recipeRestoreFocus(snap){
  if(!snap || !snap.id) return;
  const el=document.getElementById(snap.id);
  if(!el) return;
  if((snap.tag==='input' || snap.tag==='textarea') && typeof snap.value !== 'undefined'){
    el.value = snap.value;
  }
  try{
    el.focus({preventScroll:true});
    if((snap.tag==='input' || snap.tag==='textarea') && snap.start !== null && typeof el.setSelectionRange === 'function'){
      const len=String(el.value||'').length;
      const start=Math.min(Math.max(0,snap.start),len);
      const end=Math.min(Math.max(0,snap.end ?? snap.start),len);
      el.setSelectionRange(start,end);
    }
  }catch(e){}
}
function recipeFilterRecipesList(){
  const panel=recipeById('recipeListPanel');
  if(!panel) return renderRecipes();
  panel.innerHTML = recipeListPanelHtml(recipeActive());
}

function recipeShowToast(msg,type='success'){ if(typeof showToast === 'function') showToast(msg,type); else console.log(msg); }
function recipeShowWarning(msg){ if(typeof showWarning === 'function') showWarning(msg); else recipeShowToast(msg,'warning'); }
function recipeShowError(msg){ if(typeof showError === 'function') showError(msg); else recipeShowToast(msg,'error'); }
function recipeActive(){
  if(recipeMasterNewMode) return null;
  return state.recipes.find(r=>r.id===recipeMasterSelectedId) || state.recipes[0] || null;
}
function recipeList(){ return state.recipes || []; }
function recipeItemSortNumber(item, fallbackIndex=0){
  const savedOrder=recipeNum(item?.sort_order);
  if(savedOrder>0) return savedOrder;
  const created=Date.parse(item?.created_at||'');
  if(Number.isFinite(created)) return 1000000000 + created;
  return 2000000000 + fallbackIndex;
}
function recipeItemsFor(recipeId){
  return (state.recipeItems||[])
    .filter(x=>x.recipe_id===recipeId)
    .map((x,idx)=>({...x,__fallback_index:idx}))
    .sort((a,b)=>recipeItemSortNumber(a,a.__fallback_index)-recipeItemSortNumber(b,b.__fallback_index) || String(a.id||'').localeCompare(String(b.id||'')));
}
function nextRecipeItemSortOrder(recipeId){
  const items=recipeItemsFor(recipeId);
  const max=items.reduce((m,x)=>Math.max(m, recipeNum(x.sort_order)),0);
  return max>0 ? max+1 : items.length+1;
}
function recipeIngredient(id){ return (state.ingredients||[]).find(i=>i.id===id) || {}; }
function recipeProductLinks(recipeId){ return (state.productRecipes||[]).filter(x=>x.recipe_id===recipeId); }
function recipeIngredientLabel(id){ return recipeIngredient(id).name || (typeof ingredientName==='function'?ingredientName(id):''); }
function recipeOption(items, selected='', empty='Select', label='name'){
  return `<option value="">${recipeEscape(empty)}</option>` + (items||[]).map(x=>`<option value="${recipeEscape(x.id)}" ${String(x.id)===String(selected)?'selected':''}>${recipeEscape(x[label]||x.name||'')}</option>`).join('');
}
function recipeUnitOptions(selected='', empty='Unit'){
  if(typeof unitOptions === 'function') return unitOptions(selected, empty);
  const units=['g','gm','kg','ml','ltr','piece','pcs','portion'];
  return `<option value="">${recipeEscape(empty)}</option>`+units.map(u=>`<option value="${u}" ${u===selected?'selected':''}>${u}</option>`).join('');
}
function recipeSetUnitOptions(ids=[]){ ids.forEach(id=>{ const el=recipeById(id); if(el){ const cur=el.value; el.innerHTML=recipeUnitOptions(cur,'Unit'); if(cur) el.value=cur; } }); }
function recipeBaseQty(qty, unit){ return typeof toBaseUnit === 'function' ? toBaseUnit(qty,unit) : recipeNum(qty); }
function recipeIngredientConversionQty(ing){
  const explicit=recipeNum(ing.conversion_quantity ?? ing.conversion_qty ?? ing.conversionQty);
  if(explicit>0) return explicit;
  const purchase=String(ing.purchase_unit||'').toLowerCase();
  const consumption=String(ing.consumption_unit||'').toLowerCase();
  if(['kg','kilogram','kilograms'].includes(purchase) && ['g','gm','gram','grams'].includes(consumption)) return 1000;
  if(['l','ltr','litre','liter','litres','liters'].includes(purchase) && ['ml'].includes(consumption)) return 1000;
  return 1;
}
function recipeIngredientCostPerUseUnit(ing){
  const price=recipeNum(ing.purchase_price);
  const conv=recipeIngredientConversionQty(ing) || 1;
  const wastage=Math.min(recipeNum(ing.wastage_percent),99.99)/100;
  const effectivePurchaseCost = price / (1 - wastage || 1);
  return effectivePurchaseCost / conv;
}
function recipeRateDisplay(ing){
  if(!ing || !ing.id) return '—';
  const price=recipeNum(ing.purchase_price);
  const unit=ing.purchase_unit ? `/${ing.purchase_unit}` : '';
  return `${recipeMoney(price)}${unit}`;
}
function recipeItemPercent(item){ return recipeNum(item.percent_of_main_ingredient ?? item.percent_of_main ?? item.percent); }
function recipeMode(recipe){ return recipe?.calculation_mode || recipe?.calculationMode || 'direct'; }
function recipeMainQty(recipe){ return recipeNum(recipe?.main_ingredient_quantity ?? recipe?.main_qty); }
function recipeMainUnit(recipe){ return recipeSafeUnit(recipe?.main_ingredient_unit || recipe?.yield_unit || 'g'); }
function recipeItemQuantity(item, recipe){
  const mode=recipeMode(recipe);
  const pct=recipeItemPercent(item);
  if(mode === 'percentage' || mode === 'percent'){
    if(pct > 0) return recipeMainQty(recipe) * pct / 100;
    if(item.ingredient_id && item.ingredient_id === recipe?.main_ingredient_id) return recipeMainQty(recipe);
    if(recipeNum(item.calculated_quantity)>0) return recipeNum(item.calculated_quantity);
  }
  return recipeNum(item.quantity ?? item.calculated_quantity);
}
function recipeItemUnit(item, recipe){ return recipeSafeUnit(item.unit || (item.ingredient_id===recipe?.main_ingredient_id ? recipeMainUnit(recipe) : recipeIngredient(item.ingredient_id).consumption_unit) || recipeMainUnit(recipe) || 'g'); }
function recipeItemCost(item, recipe){
  const ing=recipeIngredient(item.ingredient_id);
  if(!ing.id) return 0;
  const qty=recipeBaseQty(recipeItemQuantity(item,recipe), recipeItemUnit(item,recipe));
  const cost=qty * recipeIngredientCostPerUseUnit(ing);
  return cost * (1 + recipeNum(item.waste_percent)/100);
}
function recipeTotalCost(recipeId){
  const r=(state.recipes||[]).find(x=>x.id===recipeId);
  if(!r) return 0;
  return recipeItemsFor(recipeId).reduce((sum,item)=>sum+recipeItemCost(item,r),0);
}
function recipeAutoYieldQuantity(recipe){
  const items=recipeItemsFor(recipe?.id);
  const sum=items.reduce((s,item)=>s+recipeBaseQty(recipeItemQuantity(item,recipe), recipeItemUnit(item,recipe)),0);
  return sum || recipeNum(recipe?.yield_quantity);
}
function recipeTotalBatchQty(recipe){
  return recipeAutoYieldQuantity(recipe);
}
function recipeUnitCost(recipe){
  const cost=recipeTotalCost(recipe?.id);
  const yieldQty=recipeTotalBatchQty(recipe);
  return yieldQty ? cost / yieldQty : 0;
}
async function syncRecipeAutoYield(recipeId){
  const r=(state.recipes||[]).find(x=>x.id===recipeId);
  if(!r) return;
  const autoYield=recipeAutoYieldQuantity(r);
  if(autoYield>0 && Math.abs(recipeNum(r.yield_quantity)-autoYield)>0.0001){
    try{ await dbUpdate('recipes', recipeId, {yield_quantity:autoYield, yield_unit:r.yield_unit||r.main_ingredient_unit||'g', updated_at:new Date().toISOString()}); }catch(e){ console.warn('Could not sync recipe yield', e); }
  }
}
function recipeCoreOutputs(recipe){
  const ingredientCost=recipeTotalCost(recipe?.id);
  const yieldQty=recipeTotalBatchQty(recipe);
  const fillingPerMomo=recipePositiveNum(recipe?.filling_grams_per_momo ?? recipe?.grams_per_piece) || 30;
  const fullPieces=recipePositiveNum(recipe?.full_plate_pieces) || 8;
  const halfPieces=recipePositiveNum(recipe?.half_plate_pieces) || 4;
  const wrapperPerMomo=recipePositiveNum(recipe?.wrapper_cost_per_momo) || 0;
  const fullExtra=recipePositiveNum(recipe?.full_plate_extra_cost) || 0;
  const halfExtra=recipePositiveNum(recipe?.half_plate_extra_cost) || 0;
  const momos = fillingPerMomo ? yieldQty / fillingPerMomo : 0;
  const fullPlates = fullPieces ? momos / fullPieces : 0;
  const halfPlates = halfPieces ? momos / halfPieces : 0;
  const wrapperFull = wrapperPerMomo * fullPieces;
  const wrapperHalf = wrapperPerMomo * halfPieces;
  const totalWrapper = wrapperPerMomo * momos;
  const totalBatch = ingredientCost + totalWrapper;
  const costPerMomo = momos ? totalBatch / momos : 0;
  const costPerFull = costPerMomo * fullPieces + fullExtra;
  const costPerHalf = costPerMomo * halfPieces + halfExtra;
  return {ingredientCost,yieldQty,fillingPerMomo,fullPieces,halfPieces,wrapperPerMomo,fullExtra,halfExtra,momos,fullPlates,halfPlates,wrapperFull,wrapperHalf,totalWrapper,totalBatch,costPerMomo,costPerFull,costPerHalf};
}
function recipeDataHealth(recipe){
  const warnings=[];
  if(!recipe) return warnings;
  if(!recipeAutoYieldQuantity(recipe)) warnings.push('Recipe has no yield yet. Add recipe ingredients to calculate yield automatically.');
  if(!recipe.yield_unit) warnings.push('Recipe missing yield unit');
  if((recipeMode(recipe)==='percentage'||recipeMode(recipe)==='percent') && !recipe.main_ingredient_id) warnings.push('Percentage recipe missing main ingredient');
  if(!recipeItemsFor(recipe.id).length) warnings.push('Recipe has no ingredients');
  recipeItemsFor(recipe.id).forEach(item=>{
    const ing=recipeIngredient(item.ingredient_id);
    if(!ing.id) warnings.push('Recipe item uses missing ingredient');
    if(ing.id && recipeNum(ing.purchase_price)<=0) warnings.push(`${ing.name} missing purchase price`);
    if(ing.id && recipeIngredientConversionQty(ing)<=0) warnings.push(`${ing.name} missing conversion quantity`);
    if((recipeMode(recipe)==='percentage'||recipeMode(recipe)==='percent') && recipeItemPercent(item)<=0 && item.ingredient_id!==recipe.main_ingredient_id) warnings.push(`${ing.name||'Ingredient'} missing % of main ingredient`);
  });
  return [...new Set(warnings)];
}

function ensureRecipeSelected(){
  if(recipeMasterNewMode) return;
  if(recipeMasterSelectedId && state.recipes.some(r=>r.id===recipeMasterSelectedId)) return;
  recipeMasterSelectedId = state.editing.recipe || state.recipes[0]?.id || null;
}
function setRecipeMasterSelected(id){
  recipeMasterNewMode=false;
  recipeMasterSelectedId=id||null;
  state.editing.recipe=id||null;
  recipeMasterDraft={};
  renderRecipes();
}
function getRecipeFormRow(){
  return {
    name: recipeVal('recipeName').trim(),
    category: recipeVal('recipeCategory') || 'Filling',
    calculation_mode: recipeVal('recipeCalculationMode') || 'direct',
    main_ingredient_id: recipeVal('recipeMainIngredient') || null,
    main_ingredient_quantity: recipePositiveNum(recipeVal('recipeMainQty')),
    main_ingredient_unit: recipeVal('recipeMainUnit') || recipeVal('recipeYieldUnit') || 'g',
    yield_quantity: recipePositiveNum(recipeVal('recipeYieldQty')),
    yield_unit: recipeVal('recipeYieldUnit') || recipeVal('recipeMainUnit') || 'g',
    filling_grams_per_momo: recipePositiveNum(recipeVal('recipeFillingPerMomo')) || 30,
    full_plate_pieces: recipePositiveNum(recipeVal('recipeFullPlatePieces')) || 8,
    half_plate_pieces: recipePositiveNum(recipeVal('recipeHalfPlatePieces')) || 4,
    wrapper_cost_per_momo: recipePositiveNum(recipeVal('recipeWrapperCostPerMomo')),
    full_plate_extra_cost: recipePositiveNum(recipeVal('recipeFullPlateExtraCost')),
    half_plate_extra_cost: recipePositiveNum(recipeVal('recipeHalfPlateExtraCost')),
    notes: recipeVal('recipeNotes'),
    active: recipeVal('recipeActive') !== 'false',
    updated_at: new Date().toISOString()
  };
}
function recipeCaptureDraft(){
  if(!recipeById('recipeName')) return;
  try{
    const currentDraft=getRecipeFormRow();
    if(recipeMasterNewMode) recipeMasterDraft = currentDraft;
  }catch(e){}
}
function recipeDisplayRecipe(r){
  return r ? r : recipeMasterDraft;
}

function recipeCurrentFormRecipe(baseRecipe=recipeActive()){
  const base = baseRecipe ? {...baseRecipe} : {};
  if(!recipeById('recipeName')) return base;
  let form = {};
  try{ form = getRecipeFormRow(); }catch(e){ form = {}; }
  return {
    ...base,
    ...form,
    id: base.id || recipeMasterSelectedId || form.id || null,
    created_at: base.created_at,
    updated_at: form.updated_at || base.updated_at
  };
}
function recipeLiveRecipe(){
  return recipeCurrentFormRecipe(recipeActive());
}

function recipeShouldUsePercent(recipe){
  const mode=recipeMode(recipe);
  return mode==='percentage' || mode==='percent';
}
function recipePercentFromQty(qty, mainQty){
  mainQty=recipePositiveNum(mainQty);
  return mainQty ? recipePositiveNum(qty) / mainQty * 100 : 0;
}
async function recalculateRecipePercentItems(recipeId, newRecipeRow={}, previousMainQty=null){
  const r=(state.recipes||[]).find(x=>x.id===recipeId) || {};
  const recipe={...r,...newRecipeRow,id:recipeId};
  if(!recipeShouldUsePercent(recipe)) return;
  const mainQty=recipePositiveNum(recipe.main_ingredient_quantity);
  if(!mainQty) return;
  const oldMain=recipePositiveNum(previousMainQty) || mainQty;
  const items=recipeItemsFor(recipeId);
  for(const item of items){
    let pct=recipePositiveNum(item.percent_of_main_ingredient);
    const isMain=item.ingredient_id && item.ingredient_id===recipe.main_ingredient_id;
    if(isMain) pct=100;
    if(!pct && oldMain>0) pct=recipePercentFromQty(item.quantity || item.calculated_quantity, oldMain);
    if(!pct) continue;
    const qty=mainQty*pct/100;
    await dbUpdate('recipe_items', item.id, {
      percent_of_main_ingredient:pct,
      quantity:qty,
      calculated_quantity:qty,
      quantity_entry_mode:'percentage',
      unit:item.unit || (isMain ? (recipe.main_ingredient_unit||recipe.yield_unit||'g') : (recipeIngredient(item.ingredient_id).consumption_unit || recipe.yield_unit || 'g')),
      updated_at:new Date().toISOString()
    });
  }
}

async function ensureRecipeSavedForBuilder(){
  const row=getRecipeFormRow();
  if(!row.name) { recipeShowWarning('Create/save the recipe name first.'); return null; }
  if(!row.yield_unit) row.yield_unit = row.main_ingredient_unit || 'g';
  if(recipeShouldUsePercent(row) && (!row.main_ingredient_id || !row.main_ingredient_quantity)){
    recipeShowWarning('Percentage mode needs main ingredient and main quantity before adding ingredients.');
    return null;
  }
  const existing=recipeActive();
  let saved=null;
  if(existing?.id){
    saved=await dbUpdate('recipes', existing.id, row);
  }else{
    saved=await dbInsert('recipes', row);
  }
  if(!saved) return null;
  recipeMasterNewMode=false;
  recipeMasterNewMode=false;
  recipeMasterSelectedId=saved.id;
  state.editing.recipe=saved.id;
  await refreshAll(false);
  return recipeCurrentFormRecipe(state.recipes.find(x=>x.id===saved.id) || saved);
}
async function saveRecipe(){
  const existing=recipeMasterSelectedId ? (state.recipes||[]).find(x=>x.id===recipeMasterSelectedId) : null;
  const previousMainQty=recipePositiveNum(existing?.main_ingredient_quantity);
  const row=getRecipeFormRow();
  if(!row.name) return recipeShowWarning('Recipe name is required.');
  if(!row.yield_unit) row.yield_unit = row.main_ingredient_unit || 'g';
  if(recipeShouldUsePercent(row) && (!row.main_ingredient_id || !row.main_ingredient_quantity)) return recipeShowWarning('Percentage mode needs main ingredient and main ingredient quantity.');
  let saved=null;
  const wasEditing=!!recipeMasterSelectedId;
  if(recipeMasterSelectedId) saved=await dbUpdate('recipes', recipeMasterSelectedId, row);
  else saved=await dbInsert('recipes', row);
  if(!saved) return;
  recipeMasterSelectedId=saved.id;
  state.editing.recipe=saved.id;
  await refreshAll(false);
  if(recipeShouldUsePercent(row)){
    await recalculateRecipePercentItems(saved.id, row, previousMainQty || row.main_ingredient_quantity);
    await refreshAll(false);
  }
  await syncRecipeAutoYield(saved.id);
  await refreshAll(false);
  recipeMasterNewMode=false;
  recipeMasterDraft={};
  recipeMasterSelectedId=saved.id;
  recipeShowToast(wasEditing?'Recipe updated successfully.':'Recipe created successfully.');
  renderRecipes();
}
function clearRecipeForm(){
  recipeMasterNewMode=true;
  recipeMasterSelectedId=null;
  state.editing.recipe=null;
  recipeMasterDraft={
    name:'',
    category:'Filling',
    calculation_mode:'direct',
    main_ingredient_id:null,
    main_ingredient_quantity:0,
    main_ingredient_unit:'g',
    yield_quantity:0,
    yield_unit:'g',
    filling_grams_per_momo:30,
    full_plate_pieces:8,
    half_plate_pieces:4,
    wrapper_cost_per_momo:0,
    full_plate_extra_cost:0,
    half_plate_extra_cost:0,
    notes:'',
    active:true
  };
  renderRecipes();
}
function editRecipe(id){ setRecipeMasterSelected(id); }
async function deleteRecipe(id){
  const r=state.recipes.find(x=>x.id===id);
  const ok=typeof confirmTypedDelete==='function' ? await confirmTypedDelete(`Delete recipe ${r?.name||''}? This cannot be undone.`, 'Delete recipe') : confirm(`Delete recipe ${r?.name||''}?`);
  if(!ok) return;
  const done=await dbDelete('recipes',id);
  if(done){
    recipeShowToast('Recipe deleted.');
    await refreshAll(false);
    if(recipeMasterSelectedId===id) recipeMasterSelectedId=null;
    recipeMasterNewMode=false;
    renderRecipes();
    if(typeof renderProducts==='function') renderProducts();
  }
}
async function duplicateSelectedRecipe(){
  const r=recipeActive(); if(!r) return recipeShowWarning('Select a recipe first.');
  const newRow={...r,id:undefined,name:`${r.name} Copy`,created_at:undefined,updated_at:new Date().toISOString()};
  delete newRow.id; delete newRow.created_at;
  const saved=await dbInsert('recipes',newRow); if(!saved) return;
  const rows=recipeItemsFor(r.id).map(item=>{ const copy={...item,id:undefined,recipe_id:saved.id,created_at:undefined,updated_at:new Date().toISOString()}; delete copy.id; delete copy.created_at; return copy; });
  if(rows.length) await dbInsertMany('recipe_items',rows);
  recipeMasterNewMode=false;
  recipeMasterSelectedId=saved.id;
  recipeShowToast('Recipe duplicated.');
  await refreshAll(false);
  renderRecipes();
}
async function addMainIngredientRow(){
  const r=await ensureRecipeSavedForBuilder(); if(!r) return;
  if(!r.main_ingredient_id) return recipeShowWarning('Select main ingredient first.');
  const exists=recipeItemsFor(r.id).some(x=>x.ingredient_id===r.main_ingredient_id);
  if(exists) return recipeShowWarning('Main ingredient is already added.');
  const qty=recipePositiveNum(recipeMainQty(r));
  if(!qty) return recipeShowWarning('Main ingredient quantity is required.');
  const row={recipe_id:r.id,ingredient_id:r.main_ingredient_id,quantity:qty,unit:recipeMainUnit(r),waste_percent:0,percent_of_main_ingredient:100,calculated_quantity:qty,quantity_entry_mode:'percentage',sort_order:nextRecipeItemSortOrder(r.id),updated_at:new Date().toISOString()};
  const saved=await dbInsert('recipe_items',row); if(!saved) return;
  recipeShowToast('Main ingredient added.'); await refreshAll(false); await syncRecipeAutoYield(r.id); await refreshAll(false); renderRecipes();
}
async function addRecipeItem(){
  const r=await ensureRecipeSavedForBuilder(); if(!r) return;
  const ingredientId=recipeVal('recipeItemIngredient'); if(!ingredientId) return recipeShowWarning('Select ingredient.');
  const ing=recipeIngredient(ingredientId);
  const isPercentMode=recipeShouldUsePercent(r);
  let pct=recipePositiveNum(recipeVal('recipeItemPercent'));
  const qtyInput=recipePositiveNum(recipeVal('recipeItemQty'));
  if(isPercentMode && ingredientId===r.main_ingredient_id && !pct) pct=100;
  if(isPercentMode && !pct && qtyInput>0) pct=recipePercentFromQty(qtyInput, recipeMainQty(r));
  const qty=isPercentMode && pct>0 ? recipeMainQty(r)*pct/100 : qtyInput;
  if(qty<=0) return recipeShowWarning(isPercentMode ? 'Enter % of main ingredient or quantity.' : 'Enter quantity.');
  const unit=recipeVal('recipeItemUnit') || ing.consumption_unit || recipeMainUnit(r) || 'g';
  const row={recipe_id:r.id,ingredient_id:ingredientId,quantity:qty,unit,waste_percent:recipePositiveNum(recipeVal('recipeItemWaste')),percent_of_main_ingredient:pct||null,calculated_quantity:qty,quantity_entry_mode:(isPercentMode&&pct)?'percentage':'direct',stock_available:recipePositiveNum(recipeVal('recipeItemStock'))||null,sort_order:nextRecipeItemSortOrder(r.id),updated_at:new Date().toISOString()};
  const saved=await dbInsert('recipe_items',row); if(!saved) return;
  recipeShowToast('Ingredient added to recipe.');
  await refreshAll(false); await syncRecipeAutoYield(r.id);
  ['recipeItemPercent','recipeItemQty','recipeItemWaste','recipeItemStock'].forEach(id=>recipeSetVal(id, id==='recipeItemWaste'?'0':''));
  await refreshAll(false); renderRecipes();
}
function recipeMainIngredientChanged(){
  const ing=recipeIngredient(recipeVal('recipeMainIngredient'));
  if(ing?.id){
    const u=ing.consumption_unit || ing.purchase_unit || recipeVal('recipeMainUnit') || 'g';
    recipeSetVal('recipeMainUnit', u);
    if(!recipeVal('recipeYieldUnit')) recipeSetVal('recipeYieldUnit', u);
  }
}
function recipeIngredientChanged(){
  const r=recipeLiveRecipe();
  const ing=recipeIngredient(recipeVal('recipeItemIngredient'));
  if(ing?.id){
    recipeSetVal('recipeItemUnit', ing.consumption_unit || recipeMainUnit(r) || 'g');
    if(recipeShouldUsePercent(r) && ing.id===r.main_ingredient_id){
      recipeSetVal('recipeItemPercent','100');
      recipeSetVal('recipeItemQty', recipeFormatRecipeNumber(recipeMainQty(r)));
    }else if(recipeShouldUsePercent(r)){
      if(recipePositiveNum(recipeVal('recipeItemPercent'))>0) recipeBuilderPercentChanged();
      else if(recipePositiveNum(recipeVal('recipeItemQty'))>0) recipeBuilderQtyChanged();
    }
  }
}
function recipeFormatRecipeNumber(n){
  n=recipeNum(n);
  if(!n) return '';
  return Number.isInteger(n) ? String(n) : String(Math.round(n*100)/100);
}
function recipeBuilderPercentChanged(){
  const r=recipeLiveRecipe();
  if(!recipeShouldUsePercent(r)) return;
  const mainQty=recipeMainQty(r);
  const pct=recipePositiveNum(recipeVal('recipeItemPercent'));
  if(mainQty>0 && pct>0) recipeSetVal('recipeItemQty', recipeFormatRecipeNumber(mainQty*pct/100));
  else if(!pct) recipeSetVal('recipeItemQty','');
}
function recipeBuilderQtyChanged(){
  const r=recipeLiveRecipe();
  if(!recipeShouldUsePercent(r)) return;
  const mainQty=recipeMainQty(r);
  const qty=recipePositiveNum(recipeVal('recipeItemQty'));
  if(mainQty>0 && qty>0) recipeSetVal('recipeItemPercent', recipeFormatRecipeNumber(recipePercentFromQty(qty, mainQty)));
  else if(!qty) recipeSetVal('recipeItemPercent','');
}
function recipeMainQtyChangedLive(){
  const live=recipeLiveRecipe();
  if(!recipeShouldUsePercent(live)) return;
  const newMainQty=recipePositiveNum(recipeVal('recipeMainQty'));
  if(!newMainQty) return;
  const saved=recipeActive() || {};
  const oldMainQty=recipeMainQty(saved) || newMainQty;
  (state.recipeItems||[]).filter(x=>x.recipe_id===live.id).forEach(item=>{
    let pct=recipeItemPercent(item);
    if(!pct && oldMainQty>0) pct=recipePercentFromQty(item.quantity || item.calculated_quantity, oldMainQty);
    if(pct>0){
      const qtyEl=recipeById(`recipeInlineQty_${item.id}`);
      const pctEl=recipeById(`recipeInlinePct_${item.id}`);
      if(qtyEl) qtyEl.value=recipeFormatRecipeNumber(newMainQty*pct/100);
      if(pctEl && !recipePositiveNum(pctEl.value)) pctEl.value=recipeFormatRecipeNumber(pct);
    }
  });
  recipeBuilderPercentChanged();
}
function recipeInlinePercentChanged(id,value){
  const r=recipeLiveRecipe();
  if(!recipeShouldUsePercent(r)) return;
  const mainQty=recipeMainQty(r);
  const qtyEl=recipeById(`recipeInlineQty_${id}`);
  if(qtyEl && mainQty>0){
    const pct=recipePositiveNum(value);
    qtyEl.value=pct>0 ? recipeFormatRecipeNumber(mainQty*pct/100) : '';
  }
}
function recipeInlineQtyChanged(id,value){
  const r=recipeLiveRecipe();
  if(!recipeShouldUsePercent(r)) return;
  const mainQty=recipeMainQty(r);
  const pctEl=recipeById(`recipeInlinePct_${id}`);
  if(pctEl && mainQty>0){
    const qty=recipePositiveNum(value);
    pctEl.value=qty>0 ? recipeFormatRecipeNumber(recipePercentFromQty(qty, mainQty)) : '';
  }
}
function recipeBindLiveCalculationHandlers(){
  const root=recipeById('recipes');
  if(!root) return;
  const bind=(id,fn)=>{
    const el=recipeById(id);
    if(el && el.dataset.recipeLiveBound!=='true'){
      el.dataset.recipeLiveBound='true';
      el.addEventListener('input', fn);
      el.addEventListener('change', fn);
    }
  };
  bind('recipeItemPercent', recipeBuilderPercentChanged);
  bind('recipeItemQty', recipeBuilderQtyChanged);
  bind('recipeMainQty', recipeMainQtyChangedLive);
  root.querySelectorAll('[id^="recipeInlinePct_"]').forEach(el=>{
    if(el.dataset.recipeLiveBound==='true') return;
    el.dataset.recipeLiveBound='true';
    const id=el.id.replace('recipeInlinePct_','');
    el.addEventListener('input',()=>recipeInlinePercentChanged(id,el.value));
    el.addEventListener('change',()=>recipeInlinePercentChanged(id,el.value));
  });
  root.querySelectorAll('[id^="recipeInlineQty_"]').forEach(el=>{
    if(el.dataset.recipeLiveBound==='true') return;
    el.dataset.recipeLiveBound='true';
    const id=el.id.replace('recipeInlineQty_','');
    el.addEventListener('input',()=>recipeInlineQtyChanged(id,el.value));
    el.addEventListener('change',()=>recipeInlineQtyChanged(id,el.value));
  });
}

function selectedRecipeItemIds(){
  return [...document.querySelectorAll('.recipe-item-check:checked')].map(x=>x.value).filter(Boolean);
}
function toggleAllRecipeItems(checked){
  document.querySelectorAll('.recipe-item-check').forEach(x=>{ x.checked=!!checked; });
  updateRecipeItemBulkCount();
}
function updateRecipeItemBulkCount(){
  const ids=selectedRecipeItemIds();
  const countEl=recipeById('selectedRecipeItemCount');
  if(countEl) countEl.textContent=`${ids.length} selected`;
  const panel=recipeById('recipeItemBulkActions');
  if(panel) panel.classList.toggle('hidden', ids.length<1);
  const all=recipeById('toggleAllRecipeItemsCheck');
  if(all){
    const boxes=[...document.querySelectorAll('.recipe-item-check')];
    all.checked=boxes.length>0 && boxes.every(x=>x.checked);
    all.indeterminate=boxes.some(x=>x.checked) && !all.checked;
  }
}
async function bulkUpdateRecipeItemUnit(){
  const ids=selectedRecipeItemIds();
  const unit=recipeVal('recipeBulkUnit');
  if(!ids.length) return recipeShowWarning('Select at least one ingredient row.');
  if(!unit) return recipeShowWarning('Choose the unit to apply.');
  for(const id of ids){
    await dbUpdate('recipe_items', id, {unit, updated_at:new Date().toISOString()});
  }
  recipeShowToast(`${ids.length} ingredient row(s) updated.`);
  await refreshAll(false); renderRecipes();
}
async function bulkDeleteRecipeItems(){
  const ids=selectedRecipeItemIds();
  if(!ids.length) return recipeShowWarning('Select at least one ingredient row.');
  const ok=typeof confirmTypedDelete==='function' ? await confirmTypedDelete(`Delete ${ids.length} selected recipe ingredient row(s)? This cannot be undone.`, 'Delete recipe ingredients') : confirm(`Delete ${ids.length} selected recipe ingredient row(s)?`);
  if(!ok) return;
  const recipeId=(state.recipeItems||[]).find(x=>x.id===ids[0])?.recipe_id;
  let done=false;
  if(typeof dbDeleteMany==='function') done=await dbDeleteMany('recipe_items', ids);
  else{
    done=true;
    for(const id of ids){ const okRow=await dbDelete('recipe_items',id); if(!okRow) done=false; }
  }
  if(done){
    recipeShowToast(`${ids.length} ingredient row(s) deleted.`);
    await refreshAll(false);
    if(recipeId) await syncRecipeAutoYield(recipeId);
    await refreshAll(false); renderRecipes();
    if(typeof renderProducts==='function') renderProducts();
  }
}
let recipeDraggedItemId=null;
function recipeItemDragStart(event,id){
  recipeDraggedItemId=id;
  event.dataTransfer?.setData('text/plain',id);
  event.dataTransfer && (event.dataTransfer.effectAllowed='move');
  event.currentTarget?.classList.add('recipe-row-dragging');
}
function recipeItemDragEnd(event){
  event.currentTarget?.classList.remove('recipe-row-dragging');
  document.querySelectorAll('.recipe-row-drop-target').forEach(x=>x.classList.remove('recipe-row-drop-target'));
}
function recipeItemDragOver(event){
  event.preventDefault();
  event.dataTransfer && (event.dataTransfer.dropEffect='move');
  document.querySelectorAll('.recipe-row-drop-target').forEach(x=>x.classList.remove('recipe-row-drop-target'));
  event.currentTarget?.classList.add('recipe-row-drop-target');
}
async function recipeItemDrop(event,targetId){
  event.preventDefault();
  document.querySelectorAll('.recipe-row-drop-target').forEach(x=>x.classList.remove('recipe-row-drop-target'));
  const draggedId=recipeDraggedItemId || event.dataTransfer?.getData('text/plain');
  recipeDraggedItemId=null;
  if(!draggedId || draggedId===targetId) return;
  const targetItem=(state.recipeItems||[]).find(x=>x.id===targetId);
  if(!targetItem) return;
  const recipeId=targetItem.recipe_id;
  const ids=recipeItemsFor(recipeId).map(x=>x.id).filter(Boolean);
  const from=ids.indexOf(draggedId);
  const to=ids.indexOf(targetId);
  if(from<0 || to<0) return;
  ids.splice(from,1);
  ids.splice(to,0,draggedId);
  await saveRecipeItemOrder(recipeId, ids);
}
async function moveRecipeItem(id,direction){
  const item=(state.recipeItems||[]).find(x=>x.id===id);
  if(!item) return;
  const ids=recipeItemsFor(item.recipe_id).map(x=>x.id).filter(Boolean);
  const idx=ids.indexOf(id);
  const target=idx+direction;
  if(idx<0 || target<0 || target>=ids.length) return;
  [ids[idx],ids[target]]=[ids[target],ids[idx]];
  await saveRecipeItemOrder(item.recipe_id, ids);
}
async function saveRecipeItemOrder(recipeId,orderedIds){
  for(let i=0;i<orderedIds.length;i++){
    await dbUpdate('recipe_items', orderedIds[i], {sort_order:i+1});
  }
  recipeShowToast('Ingredient order updated.');
  await refreshAll(false); renderRecipes();
}

async function updateRecipeItemField(id,field,value){
  const item=state.recipeItems.find(x=>x.id===id);
  const r=recipeLiveRecipe();
  if(!item || !r?.id) return;
  const row={updated_at:new Date().toISOString()};
  if(['quantity','waste_percent','percent_of_main_ingredient','stock_available'].includes(field)) row[field]=recipeNum(value);
  else row[field]=value;
  if(recipeShouldUsePercent(r) && field==='quantity'){
    row.percent_of_main_ingredient=recipePercentFromQty(value, recipeMainQty(r));
    row.calculated_quantity=recipeMainQty(r)*row.percent_of_main_ingredient/100;
    row.quantity=row.calculated_quantity;
    row.quantity_entry_mode='percentage';
  }
  if(recipeShouldUsePercent(r) && field==='percent_of_main_ingredient'){
    row.calculated_quantity=recipeMainQty(r)*recipeNum(value)/100;
    row.quantity=row.calculated_quantity;
    row.quantity_entry_mode='percentage';
  }
  const saved=await dbUpdate('recipe_items',id,row); if(!saved) return;
  await refreshAll(false); await syncRecipeAutoYield(r.id); await refreshAll(false); renderRecipes();
}
async function deleteRecipeItem(id){
  const item=state.recipeItems.find(x=>x.id===id);
  const recipeId=item?.recipe_id;
  const ok=typeof confirmTypedDelete==='function' ? await confirmTypedDelete('Delete this ingredient from the recipe?', 'Delete recipe ingredient') : confirm('Delete this ingredient?');
  if(!ok) return;
  const done=await dbDelete('recipe_items',id); if(done){ recipeShowToast('Recipe ingredient deleted.'); await refreshAll(false); if(recipeId) await syncRecipeAutoYield(recipeId); await refreshAll(false); renderRecipes(); if(typeof renderProducts==='function') renderProducts(); }
}
async function linkRecipeToProduct(){ recipeShowWarning('Product links are now managed only from Products → Product Cost Builder.'); }
async function unlinkRecipeFromProduct(id){ recipeShowWarning('Product links are now managed only from Products → Product Cost Builder.'); }

function renderRecipeSelectors(){
  const ids=['recipeItemIngredient','recipeMainIngredient'];
  ids.forEach(id=>{ const el=recipeById(id); if(el){ const cur=el.value; el.innerHTML=recipeOption(state.ingredients,cur,'Select Ingredient'); if(cur) el.value=cur; } });
  const prod=recipeById('recipeLinkedProductSelect'); if(prod){ const cur=prod.value; prod.innerHTML=recipeOption(state.products,cur,'Select Product'); if(cur) prod.value=cur; }
  recipeSetUnitOptions(['recipeYieldUnit','recipeMainUnit','recipeItemUnit']);
  if(typeof refreshGlobalSmartSuggestions==='function') refreshGlobalSmartSuggestions();
}
function renderRecipeItems(){ renderRecipes(); }
function recipeListPanelHtml(active){
  const q=recipeVal('recipeMasterSearch').toLowerCase();
  const list=recipeList().filter(r=>[r.name,r.category,r.yield_unit].join(' ').toLowerCase().includes(q));
  if(!list.length) return `<div class="recipe-empty">No recipes yet. Create your first batch recipe.</div>`;
  return list.map(r=>{
    const cost=recipeTotalCost(r.id); const warn=recipeDataHealth(r).length;
    return `<button type="button" class="recipe-list-item ${active?.id===r.id?'active':''}" onclick="setRecipeMasterSelected('${r.id}')"><strong>${recipeEscape(r.name)}</strong><small>${recipeEscape(r.category||'Other')} · ${recipeEscape(recipeMode(r)==='percentage'?'% of main ingredient':'Direct quantity')} · ${recipeMoney(cost)}</small>${warn?`<small>⚠ ${warn} issue(s)</small>`:`<small>✓ Healthy</small>`}</button>`;
  }).join('');
}
function recipeHeaderFormHtml(r){
  const mode=recipeMode(r||{});
  const isNew=!r || !r.id || recipeMasterNewMode;
  return `<div class="recipe-card">
    <div class="recipe-card-head"><div><h3>${isNew?'Create New Recipe':'Create / Update Recipe'}</h3><p>${isNew?'Enter the recipe header first, then add ingredients/components.':'Batch recipe details and calculation method.'}</p></div></div>
    <div class="recipe-card-body">
      <div class="recipe-form-grid">
        <div class="recipe-field"><label>Recipe Name <b>*</b></label><input id="recipeName" value="${recipeEscape(r?.name||'')}" placeholder="Veg Momo Filling"></div>
        <div class="recipe-field"><label>Category <b>*</b></label><select id="recipeCategory"><option ${r?.category==='Filling'?'selected':''}>Filling</option><option ${r?.category==='Dough'?'selected':''}>Dough</option><option ${r?.category==='Chutney'?'selected':''}>Chutney</option><option ${r?.category==='Sauce'?'selected':''}>Sauce</option><option ${r?.category==='Masala'?'selected':''}>Masala</option><option ${r?.category==='Marinade'?'selected':''}>Marinade</option><option ${r?.category==='Beverage'?'selected':''}>Beverage</option><option ${r?.category==='Dessert'?'selected':''}>Dessert</option><option ${r?.category==='Other'?'selected':''}>Other</option></select></div>
        <div class="recipe-field"><label>Calculation Mode <b>*</b></label><select id="recipeCalculationMode" onchange="recipeMainQtyChangedLive(); recipeBuilderPercentChanged();"><option value="direct" ${mode==='direct'?'selected':''}>Direct Quantity</option><option value="percentage" ${(mode==='percentage'||mode==='percent')?'selected':''}>% of Main Ingredient</option></select></div>
        <div class="recipe-field"><label>Status <b>*</b></label><select id="recipeActive"><option value="true" ${r?.active!==false?'selected':''}>Active</option><option value="false" ${r?.active===false?'selected':''}>Inactive</option></select></div>
        <div class="recipe-field"><label>Main Ingredient</label><select id="recipeMainIngredient" onchange="recipeMainIngredientChanged()">${recipeOption(state.ingredients,r?.main_ingredient_id,'Select Ingredient')}</select></div>
        <div class="recipe-field"><label>Main Ingredient Quantity</label><div class="recipe-input-group"><input id="recipeMainQty" type="number" value="${recipeEscape(r?.main_ingredient_quantity||'')}" placeholder="1000" oninput="recipeMainQtyChangedLive()"><select id="recipeMainUnit" data-native-select="true">${recipeUnitOptions(r?.main_ingredient_unit||r?.yield_unit||'g','Unit')}</select></div></div>
        <div class="recipe-field"><label>Yield Quantity <span class="muted">(auto)</span></label><div class="recipe-input-group"><input id="recipeYieldQty" type="number" readonly value="${recipeEscape(r?recipeAutoYieldQuantity(r):recipeNum(r?.yield_quantity)||'')}" placeholder="Auto after ingredients"><select id="recipeYieldUnit" data-native-select="true">${recipeUnitOptions(r?.yield_unit||r?.main_ingredient_unit||'g','Unit')}</select></div></div>
        <div class="recipe-field"><label>Filling / Momo</label><div class="recipe-input-group"><input id="recipeFillingPerMomo" type="number" value="${recipeEscape(r?.filling_grams_per_momo||30)}"><span>g</span></div></div>
        <div class="recipe-field"><label>Full Plate Pieces</label><input id="recipeFullPlatePieces" type="number" value="${recipeEscape(r?.full_plate_pieces||8)}"></div>
        <div class="recipe-field"><label>Half Plate Pieces</label><input id="recipeHalfPlatePieces" type="number" value="${recipeEscape(r?.half_plate_pieces||4)}"></div>
        <div class="recipe-field"><label>Wrapper Cost / Momo</label><input id="recipeWrapperCostPerMomo" type="number" value="${recipeEscape(r?.wrapper_cost_per_momo||0)}"></div>
        <div class="recipe-field"><label>Full Plate Extra Cost</label><input id="recipeFullPlateExtraCost" type="number" value="${recipeEscape(r?.full_plate_extra_cost||0)}"></div>
        <div class="recipe-field"><label>Half Plate Extra Cost</label><input id="recipeHalfPlateExtraCost" type="number" value="${recipeEscape(r?.half_plate_extra_cost||0)}"></div>
        <div class="recipe-field recipe-textarea"><label>Notes</label><textarea id="recipeNotes" placeholder="Add notes for this recipe...">${recipeEscape(r?.notes||'')}</textarea></div>
      </div>
      <p class="muted" style="margin:12px 0 0">Yield quantity is calculated automatically from the ingredient rows. Select only the yield unit here.</p><div class="recipe-actions-row"><button class="recipe-btn primary" onclick="saveRecipe()">💾 Save Recipe</button><button class="recipe-btn" onclick="duplicateSelectedRecipe()">⧉ Duplicate Recipe</button><button class="recipe-btn" onclick="addMainIngredientRow()">+ Add Main Ingredient Row</button>${r?`<button class="recipe-btn danger" onclick="deleteRecipe('${r.id}')">Delete</button>`:''}</div>
    </div>
  </div>`;
}
function recipeIngredientBuilderHtml(r){
  const items=recipeItemsFor(r?.id);
  const mode=recipeMode(r||{});
  const newHint=(!r || !r.id || recipeMasterNewMode) ? '<div class="recipe-warning-list" style="margin:12px 14px"><strong>New recipe mode:</strong><span>Fill the recipe header and click Save Recipe, or select an ingredient and click Add Ingredient to auto-save the recipe first.</span></div>' : '';
  return `<div class="recipe-card">
    <div class="recipe-card-head"><div><h3>Recipe Ingredient Builder</h3><p>In percentage mode, enter % and the app calculates qty. If you enter qty, the app calculates % from the main ingredient.</p></div></div>${newHint}
    <div class="recipe-toolbar">
      <div class="recipe-field" style="min-width:220px;margin:0"><select id="recipeItemIngredient" onchange="recipeIngredientChanged()">${recipeOption(state.ingredients,'','Select Ingredient')}</select></div>
      <div class="recipe-field" style="width:120px;margin:0"><input id="recipeItemPercent" type="number" placeholder="%" oninput="recipeBuilderPercentChanged()"></div>
      <div class="recipe-field" style="width:140px;margin:0"><input id="recipeItemQty" type="number" placeholder="Qty" oninput="recipeBuilderQtyChanged()"></div>
      <div class="recipe-field" style="width:110px;margin:0"><select id="recipeItemUnit" data-native-select="true">${recipeUnitOptions(r?.yield_unit||'g','Unit')}</select></div>
      <div class="recipe-field" style="width:110px;margin:0"><input id="recipeItemWaste" type="number" placeholder="Waste %" value="0"></div>
      <div class="recipe-field" style="width:150px;margin:0"><input id="recipeItemStock" type="number" placeholder="Stock optional"></div>
      <button class="recipe-btn primary" onclick="addRecipeItem()">+ Add Ingredient</button>
      <div class="recipe-field" style="width:210px;margin:0"><select id="recipeIngredientImportMode" data-native-select="true"><option value="upsert">Import Mode: Update/Add</option><option value="replace">Import Mode: Replace recipe ingredients</option></select></div>
      <button class="recipe-btn" onclick="document.getElementById('recipeItemsImportFile')?.click()">↥ Import Ingredients</button><input class="recipe-hidden-file" id="recipeItemsImportFile" type="file" accept=".csv,.xlsx,.xls" onchange="importRecipeIngredientsCSV(this)">
      <button class="recipe-btn" onclick="downloadRecipeIngredientImportTemplate()">Ingredient Template</button>
      <span class="spacer"></span><button class="recipe-btn" onclick="exportRecipeItemsCSV()">Export Ingredients CSV</button>
    </div>
    <div class="recipe-bulk-bar hidden" id="recipeItemBulkActions">
      <div class="recipe-bulk-count" id="selectedRecipeItemCount">0 selected</div>
      <div><label>Update selected unit</label><select id="recipeBulkUnit" data-native-select="true">${recipeUnitOptions('', 'Choose Unit')}</select></div>
      <button class="recipe-btn success" onclick="bulkUpdateRecipeItemUnit()">Update Unit</button>
      <button class="recipe-btn danger" onclick="bulkDeleteRecipeItems()">Delete Selected</button>
      <button class="recipe-btn" onclick="toggleAllRecipeItems(false)">Clear Selection</button>
    </div>
    <div id="recipeIngredientImportResults">${recipeIngredientImportResultHtml()}</div>
    <div class="recipe-table-wrap">${items.length?recipeIngredientTableHtml(r,items):`<div class="recipe-empty">No ingredients added yet. Start with the main ingredient, then add other ingredients by percentage or direct quantity.</div>`}</div>
  </div>`;
}
function recipeIngredientTableHtml(r,items){
  const total=items.reduce((s,item)=>s+recipeItemCost(item,r),0);
  const rows=items.map((item,idx)=>{
    const ing=recipeIngredient(item.ingredient_id); const qty=recipeItemQuantity(item,r); const unit=recipeItemUnit(item,r); let pct=recipeItemPercent(item); if(!pct && recipeShouldUsePercent(r) && recipeMainQty(r)>0) pct=recipePercentFromQty(qty, recipeMainQty(r)); const cost=recipeItemCost(item,r); const stock=recipeNum(item.stock_available); const possible=qty>0 && stock>0 ? stock/qty : 0;
    return `<tr draggable="true" ondragstart="recipeItemDragStart(event,'${item.id}')" ondragend="recipeItemDragEnd(event)" ondragover="recipeItemDragOver(event)" ondrop="recipeItemDrop(event,'${item.id}')">
      <td class="num"><input type="checkbox" class="recipe-item-check" value="${item.id}" onchange="updateRecipeItemBulkCount()"></td>
      <td class="num"><span class="recipe-row-drag-handle" title="Drag to reorder">☰</span></td>
      <td class="num">${idx+1}</td>
      <td class="recipe-inline-name"><strong>${recipeEscape(ing.name||'Missing Ingredient')}</strong>${ing.category?`<br><small>${recipeEscape(ing.category)}</small>`:''}</td>
      <td class="num"><input id="recipeInlineQty_${item.id}" class="recipe-inline-input" type="number" value="${qty.toFixed(2)}" oninput="recipeInlineQtyChanged('${item.id}',this.value)" onchange="updateRecipeItemField('${item.id}','quantity',this.value)"></td>
      <td class="num"><input id="recipeInlinePct_${item.id}" class="recipe-inline-input" type="number" value="${pct?recipeFormatRecipeNumber(pct):''}" placeholder="—" oninput="recipeInlinePercentChanged('${item.id}',this.value)" onchange="updateRecipeItemField('${item.id}','percent_of_main_ingredient',this.value)"></td>
      <td><select class="recipe-inline-select" data-native-select="true" onchange="updateRecipeItemField('${item.id}','unit',this.value)">${recipeUnitOptions(unit,'Unit')}</select></td>
      <td class="num">${recipeEscape(recipeRateDisplay(ing))}</td>
      <td class="num"><strong>${recipeMoney(cost)}</strong></td>
      <td class="num"><input class="recipe-inline-input" type="number" value="${stock||''}" placeholder="—" onchange="updateRecipeItemField('${item.id}','stock_available',this.value)"></td>
      <td class="num">${possible.toFixed(2)}</td>
      <td class="num"><button class="recipe-btn small" onclick="moveRecipeItem('${item.id}',-1)" title="Move up">↑</button><button class="recipe-btn small" onclick="moveRecipeItem('${item.id}',1)" title="Move down">↓</button><button class="recipe-btn small danger" onclick="deleteRecipeItem('${item.id}')">Delete</button></td>
    </tr>`;
  }).join('');
  return `<table class="recipe-master-table"><thead><tr><th><input id="toggleAllRecipeItemsCheck" type="checkbox" onchange="toggleAllRecipeItems(this.checked)"></th><th class="num">Order</th><th>#</th><th>Ingredient Name</th><th class="num">Quantity per Batch</th><th class="num">% of Main Ingredient</th><th>Unit</th><th class="num">Rate / Base Unit</th><th class="num">Ingredient Cost</th><th class="num">Stock Available</th><th class="num">Possible Batches</th><th class="num">Actions</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="4"><strong>Total Ingredients: ${items.length}</strong></td><td colspan="4"></td><td class="num">${recipeMoney(total)}</td><td></td><td class="num">${Math.min(...items.map(i=>{const q=recipeItemQuantity(i,r); const st=recipeNum(i.stock_available); return q>0&&st>0?st/q:Infinity;})).toString()==='Infinity'?'0.00':Math.min(...items.map(i=>{const q=recipeItemQuantity(i,r); const st=recipeNum(i.stock_available); return q>0&&st>0?st/q:Infinity;})).toFixed(2)}</td><td></td></tr></tfoot></table>`;
}
function recipeCoreOutputsHtml(r){
  if(!r) return `<div class="recipe-output-card"><h3>Core Outputs</h3><p class="muted">Create or select a recipe to see cost output.</p></div>`;
  const o=recipeCoreOutputs(r);
  const unit=recipeUnitFamily(r.yield_unit);
  return `<div class="recipe-output-card"><h3>Core Outputs</h3>
    <div class="recipe-output-row"><span>Total Recipe Cost / Batch</span><strong class="green">${recipeMoney(o.ingredientCost)}</strong></div>
    <div class="recipe-output-row"><span>Total Recipe Yield / Batch</span><strong class="green">${o.yieldQty.toFixed(1)} ${recipeEscape(unit)}</strong></div>
    <div class="recipe-output-row"><span>Cost per ${recipeEscape(unit)}</span><strong>${recipeMoney(recipeUnitCost(r))}</strong></div>
    <div class="recipe-output-row"><span>Number of Momos / Batch</span><strong>${o.momos.toFixed(1)}</strong></div>
    <div class="recipe-output-row"><span>Full Plates / Batch</span><strong>${o.fullPlates.toFixed(1)}</strong></div>
    <div class="recipe-output-row"><span>Half Plates / Batch</span><strong>${o.halfPlates.toFixed(1)}</strong></div>
    <div class="recipe-output-row group"><span>Wrapper Cost / Momo</span><strong>${recipeMoney(o.wrapperPerMomo)}</strong></div>
    <div class="recipe-output-row"><span>Wrapper Cost / Full Plate</span><strong>${recipeMoney(o.wrapperFull)}</strong></div>
    <div class="recipe-output-row"><span>Wrapper Cost / Half Plate</span><strong>${recipeMoney(o.wrapperHalf)}</strong></div>
    <div class="recipe-output-row"><span>Total Wrapper Cost / Batch</span><strong class="green">${recipeMoney(o.totalWrapper)}</strong></div>
    <div class="recipe-output-row group"><span>Full Plate Extra Cost</span><strong>${recipeMoney(o.fullExtra)}</strong></div>
    <div class="recipe-output-row"><span>Half Plate Extra Cost</span><strong>${recipeMoney(o.halfExtra)}</strong></div>
    <div class="recipe-output-row group"><span>Total Batch Cost</span><strong class="blue">${recipeMoney(o.totalBatch)}</strong></div>
    <div class="recipe-output-row"><span>Cost per Momo</span><strong class="blue">${recipeMoney(o.costPerMomo)}</strong></div>
    <div class="recipe-output-row"><span>Cost per Full Plate</span><strong class="blue">${recipeMoney(o.costPerFull)}</strong></div>
    <div class="recipe-output-row"><span>Cost per Half Plate</span><strong class="blue">${recipeMoney(o.costPerHalf)}</strong></div>
  </div>`;
}
function recipeLinkedProductsHtml(r){
  if(!r) return '';
  const links=recipeProductLinks(r.id);
  const componentLinks=(state.productComponents||[]).filter(x=>String(x.recipe_id)===String(r.id));
  const rows=[];
  links.forEach(l=>{ const p=(state.products||[]).find(x=>x.id===l.product_id)||{}; rows.push(`<tr><td>${recipeEscape(p.name||'Missing Product')}</td><td>${recipeEscape(l.quantity_used||'')}</td><td>${recipeEscape(l.unit||'')}</td><td>Old Product Recipe Link</td></tr>`); });
  componentLinks.forEach(c=>{ const p=(state.products||[]).find(x=>x.id===c.product_id)||{}; rows.push(`<tr><td>${recipeEscape(p.name||'Missing Product')}</td><td>${recipeEscape(c.quantity||'')}</td><td>${recipeEscape(c.unit||'')}</td><td>${recipeEscape(c.component_name||'Product Component')}</td></tr>`); });
  return `<div class="recipe-output-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px"><h3 style="margin:0">Used In Products</h3><button class="recipe-btn small" onclick="showTab('products')">Manage in Products</button></div>
    ${rows.length?`<div class="recipe-table-wrap">${table(['Product','Qty','Unit','Component'],rows)}</div>`:`<p class="muted">No products use this recipe yet.</p>`}
    <p class="muted" style="margin-top:10px">Product linking is managed only from Products → Product Cost Builder, so quantity and costing stay in one place.</p>
  </div>`;
}
function recipeHealthStripHtml(r){
  const warnings=r?recipeDataHealth(r):[];
  const productMissing=(state.products||[]).filter(p=>!(state.productRecipes||[]).some(pr=>pr.product_id===p.id)).length;
  return `<div class="recipe-data-health-strip"><span class="recipe-health-title">💙 Data Health</span>${warnings.length?warnings.slice(0,3).map(w=>`<span class="recipe-warning-chip">⚠ ${recipeEscape(w)}</span>`).join(''):`<span class="recipe-info-chip">✓ Selected recipe looks healthy</span>`}${productMissing?`<span class="recipe-warning-chip">⚠ ${productMissing} products missing recipe mapping</span>`:''}<span style="margin-left:auto;color:#64748b;font-size:13px">Warnings are reminders only.</span></div>`;
}
function renderRecipes(){
  injectRecipeMasterStyles();
  const focusSnap = recipeSnapshotFocus();
  recipeCaptureDraft();
  const root=recipeById('recipes'); if(!root) return;
  ensureRecipeSelected();
  const activeRecipe=recipeActive();
  const r=recipeDisplayRecipe(activeRecipe);
  const total=state.recipes.length;
  const activeCount=state.recipes.filter(x=>x.active!==false).length;
  const avgCost=total ? state.recipes.reduce((s,x)=>s+recipeTotalCost(x.id),0)/total : 0;
  const warningCount=(r?recipeDataHealth(r).length:0);
  root.innerHTML=`<div class="recipe-master-page">
    <div class="recipe-page-title"><div><h1>Recipe Master</h1><p>Build batch recipes, calculate cost, and link them to products.</p></div><div class="recipe-top-actions"><div class="recipe-command-search">🔎 <input id="recipeMasterSearch" placeholder="Search recipes..." value="${recipeEscape(recipeVal('recipeMasterSearch'))}" oninput="recipeFilterRecipesList()"></div><button class="recipe-btn" onclick="document.getElementById('recipeHeaderImportFile')?.click()">↥ Import Headers</button><input class="recipe-hidden-file" id="recipeHeaderImportFile" type="file" accept=".csv,.xlsx,.xls" onchange="importRecipeHeadersFile(this)"><button class="recipe-btn" onclick="downloadRecipeHeaderImportTemplate()">Header Template</button><button class="recipe-btn" onclick="downloadRecipeIngredientImportTemplate()">Ingredient Template</button><button class="recipe-btn" onclick="exportRecipesCSV()">Export CSV</button></div></div>
    <div class="recipe-kpi-grid"><div class="recipe-kpi-card"><div class="recipe-kpi-icon">📖</div><div><span>Total Recipes</span><strong>${total}</strong><small>All time</small></div></div><div class="recipe-kpi-card"><div class="recipe-kpi-icon green">✓</div><div><span>Active Recipes</span><strong>${activeCount}</strong><small>${total?((activeCount/total)*100).toFixed(1):0}% of total</small></div></div><div class="recipe-kpi-card"><div class="recipe-kpi-icon purple">₹</div><div><span>Avg Cost / Batch</span><strong>${recipeMoney(avgCost)}</strong><small>Across all recipes</small></div></div><div class="recipe-kpi-card"><div class="recipe-kpi-icon orange">♡</div><div><span>Data Health</span><strong>${warningCount?`${Math.max(0,100-warningCount*10)}%`:'100%'}</strong><small>${warningCount?'Needs review':'Good'}</small></div></div></div>
    <div id="recipeHeaderImportResults">${recipeHeaderImportResultHtml()}</div>
    <div class="recipe-list-grid"><div class="recipe-card"><div class="recipe-card-head"><div><h3>Recipe List</h3><p>Select a recipe to edit or cost.</p></div><button class="recipe-btn small primary" onclick="clearRecipeForm()">+ New</button></div><div class="recipe-card-body recipe-list-panel" id="recipeListPanel">${recipeListPanelHtml(r)}</div></div><div>${recipeHeaderFormHtml(r)}</div></div>
    <div class="recipe-workspace"><div>${recipeIngredientBuilderHtml(r)}<div style="height:14px"></div>${recipeHealthStripHtml(r)}</div><div class="recipe-side-stack">${recipeCoreOutputsHtml(r)}${recipeLinkedProductsHtml(activeRecipe)}</div></div>
  </div>`;
  renderRecipeSelectors();
  recipeBindLiveCalculationHandlers();
  recipeRestoreFocus(focusSnap);
}
function exportRecipesCSV(){
  const rows=state.recipes.length ? state.recipes.map(r=>({
    recipe_name:r.name,category:r.category,calculation_mode:recipeMode(r),main_ingredient:recipeIngredientLabel(r.main_ingredient_id),main_ingredient_quantity:r.main_ingredient_quantity,main_ingredient_unit:r.main_ingredient_unit,yield_quantity:recipeAutoYieldQuantity(r),yield_unit:r.yield_unit,filling_grams_per_momo:r.filling_grams_per_momo,full_plate_pieces:r.full_plate_pieces,half_plate_pieces:r.half_plate_pieces,wrapper_cost_per_momo:r.wrapper_cost_per_momo,full_plate_extra_cost:r.full_plate_extra_cost,half_plate_extra_cost:r.half_plate_extra_cost,notes:r.notes,active:r.active!==false,total_recipe_cost:recipeTotalCost(r.id),cost_per_unit:recipeUnitCost(r)
  })) : [{recipe_name:'Veg Momo Filling',category:'Filling',calculation_mode:'percentage',main_ingredient:'Cabbage',main_ingredient_quantity:1000,main_ingredient_unit:'g',yield_quantity:1870,yield_unit:'g',filling_grams_per_momo:30,full_plate_pieces:8,half_plate_pieces:4,wrapper_cost_per_momo:1.06,full_plate_extra_cost:25,half_plate_extra_cost:21,notes:'Sample recipe row',active:true,total_recipe_cost:108.64,cost_per_unit:0.058}];
  downloadCSV(state.recipes.length?'khumbuka_recipes.csv':'khumbuka_recipes_sample_schema.csv',rows);
}
function exportRecipeItemsCSV(){
  const r=recipeActive();
  const items=r?recipeItemsFor(r.id):[];
  const rows=items.length ? items.map(item=>({recipe_name:r.name,ingredient_name:recipeIngredientLabel(item.ingredient_id),quantity_per_batch:recipeItemQuantity(item,r),percent_of_main_ingredient:recipeItemPercent(item),unit:recipeItemUnit(item,r),rate_base_unit:recipeRateDisplay(recipeIngredient(item.ingredient_id)),ingredient_cost:recipeItemCost(item,r),stock_available:item.stock_available||'',possible_batches:recipeItemQuantity(item,r)>0&&recipeNum(item.stock_available)>0?recipeNum(item.stock_available)/recipeItemQuantity(item,r):0,waste_percent:item.waste_percent||0})) : [{recipe_name:'Veg Momo Filling',ingredient_name:'Cabbage',quantity_per_batch:1000,percent_of_main_ingredient:100,unit:'g',rate_base_unit:'₹40/kg',ingredient_cost:40,stock_available:'',possible_batches:0,waste_percent:0},{recipe_name:'Veg Momo Filling',ingredient_name:'Onion',quantity_per_batch:200,percent_of_main_ingredient:20,unit:'g',rate_base_unit:'₹26/kg',ingredient_cost:5.20,stock_available:'',possible_batches:0,waste_percent:0}];
  downloadCSV(items.length?'khumbuka_recipe_ingredients.csv':'khumbuka_recipe_ingredients_sample_schema.csv', rows);
}

function parseRecipeCsv(text){
  const lines=String(text||'').split(/\r?\n/).filter(x=>x.trim()); if(!lines.length) return [];
  const parseLine=line=>{ const out=[]; let cur='',q=false; for(let i=0;i<line.length;i++){ const c=line[i]; if(c==='"' && line[i+1]==='"'){cur+='"';i++;} else if(c==='"') q=!q; else if(c===','&&!q){out.push(cur);cur='';} else cur+=c;} out.push(cur); return out.map(x=>x.trim()); };
  const headers=parseLine(lines[0]).map(recipeNormalizeImportKey);
  return lines.slice(1).map((line,idx)=>{ const cells=parseLine(line); const row={_row:idx+2,_sheetName:''}; headers.forEach((h,i)=>row[h]=cells[i]??''); return row; });
}
function recipeNormalizeImportKey(key){
  return String(key||'')
    .trim()
    .toLowerCase()
    .replace(/%/g,'percent')
    .replace(/&/g,'and')
    .replace(/[^a-z0-9]+/g,'_')
    .replace(/^_|_$/g,'');
}
function recipeNormalizeImportRow(row,rowNumber='',sheetName=''){
  const out={_row:row.__rowNumber||row._row||rowNumber,_sheetName:row.__sheetName||row._sheetName||sheetName};
  Object.entries(row||{}).forEach(([key,value])=>{
    if(String(key).startsWith('__') || String(key).startsWith('_')) return;
    out[recipeNormalizeImportKey(key)] = value;
  });
  return out;
}
function recipeImportPick(row, aliases=[]){
  for(const alias of aliases){
    const key=recipeNormalizeImportKey(alias);
    const value=row[key];
    if(value!==undefined && value!==null && String(value).trim()!=='') return value;
  }
  return '';
}
function recipeImportNumber(value){
  if(value===undefined || value===null || value==='') return 0;
  if(typeof value==='number') return Number.isFinite(value) ? value : 0;
  const cleaned=String(value).replace(/,/g,'').replace(/₹/g,'').trim();
  const match=cleaned.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) || 0 : 0;
}
function recipeImportPercent(value){
  if(value===undefined || value===null || value==='') return 0;
  if(typeof value==='number') return value>0 && value<=1 ? value*100 : value;
  const text=String(value).trim();
  const n=recipeImportNumber(text);
  if(text.includes('%')) return n;
  return n>0 && n<=1 ? n*100 : n;
}
async function readRecipeIngredientImportRows(file){
  const name=String(file?.name||'').toLowerCase();
  if(name.endsWith('.csv')) return parseRecipeCsv(await file.text()).map(recipeNormalizeImportRow);
  if(typeof XLSX !== 'undefined'){
    const buffer=await file.arrayBuffer();
    const workbook=XLSX.read(buffer,{type:'array'});
    const rows=[];
    workbook.SheetNames.forEach(sheetName=>{
      const sheet=workbook.Sheets[sheetName];
      const data=XLSX.utils.sheet_to_json(sheet,{defval:''});
      data.forEach((row,idx)=>rows.push(recipeNormalizeImportRow(row, idx+2, sheetName)));
    });
    return rows;
  }
  if(typeof readSheetFile === 'function'){
    const data=await readSheetFile(file,{allSheets:true});
    return (data||[]).map((row,idx)=>recipeNormalizeImportRow(row,row.__rowNumber||idx+2,row.__sheetName||''));
  }
  throw new Error('Excel import needs XLSX library. Please upload CSV or make sure xlsx library is loaded.');
}
function recipeImportResolveRecipe(row, activeRecipe){
  const recipeName=String(recipeImportPick(row,['recipe_name','recipe','recipe name','name'])||'').trim();
  if(recipeName){
    return (state.recipes||[]).find(x=>String(x.name||'').trim().toLowerCase()===recipeName.toLowerCase()) || null;
  }
  return activeRecipe || null;
}
function recipeImportIssue(row, name, reason, extra={}){
  return {row:row._row||'', sheet:row._sheetName||'', name:name||'', reason, ...extra};
}
let recipeLastIngredientImportIssues=[];
let recipeLastIngredientImportSummary=null;
function recipeIngredientImportResultHtml(){
  const result=recipeLastIngredientImportSummary;
  if(!result) return '';
  const issues=result.issues||[];
  const missing=issues.filter(x=>x.type==='missing_ingredient');
  const issueRows=issues.slice(0,120).map(x=>`<tr><td>${recipeEscape(x.row||'')}</td><td>${recipeEscape(x.sheet||'')}</td><td>${recipeEscape(x.recipe||'')}</td><td>${recipeEscape(x.name||x.ingredient||'')}</td><td>${recipeEscape(x.reason||'')}</td></tr>`);
  const missingRows=missing.slice(0,80).map(x=>`<tr><td>${recipeEscape(x.recipe||'')}</td><td>${recipeEscape(x.ingredient||x.name||'')}</td><td>${recipeEscape(x.suggested_unit||'g')}</td><td>${recipeEscape(x.reason||'')}</td></tr>`);
  return `<div class="recipe-import-result-card" style="margin:10px 0">
    <div><strong>Import complete:</strong> ${result.inserted||0} inserted, ${result.updated||0} updated, ${result.skipped||0} skipped.</div>
    ${missing.length?`<div class="recipe-warning-list" style="margin-top:10px"><strong>${missing.length} missing ingredient${missing.length>1?'s':''} found:</strong><span>These rows were skipped because the ingredient does not exist in Ingredient Master yet. Add/import these ingredients first with price, unit and conversion, then import this recipe sheet again.</span></div><div class="recipe-table-wrap" style="margin-top:10px">${table(['Recipe','Missing Ingredient','Suggested Unit','Reason'],missingRows)}</div><button class="recipe-btn small" onclick="downloadRecipeImportMissingIngredients()">Download missing ingredients</button>`:''}
    ${issues.length?`<div class="recipe-table-wrap" style="margin-top:10px">${table(['Row','Sheet','Recipe','Name','Reason'],issueRows)}</div><button class="recipe-btn small" onclick="downloadRecipeIngredientImportIssues()">Download skipped reasons</button>`:'<span class="positive-text"> No skipped rows.</span>'}
  </div>`;
}
function recipeRenderIngredientImportResults(result){
  recipeLastIngredientImportSummary=result||null;
  recipeLastIngredientImportIssues=(result&&result.issues)||[];
  const target=recipeById('recipeIngredientImportResults');
  if(target) target.innerHTML=recipeIngredientImportResultHtml();
}
function downloadRecipeIngredientImportIssues(){
  const rows=(recipeLastIngredientImportIssues||[]).map(x=>({'Row':x.row||'', 'Sheet':x.sheet||'', 'Recipe':x.recipe||'', 'Name':x.name||x.ingredient||'', 'Reason':x.reason||''}));
  if(rows.length) downloadCSV('recipe_ingredient_import_skipped_reasons.csv', rows);
}
function downloadRecipeImportMissingIngredients(){
  const rows=(recipeLastIngredientImportIssues||[]).filter(x=>x.type==='missing_ingredient').map(x=>({
    'Ingredient Name':x.ingredient||x.name||'',
    'Category':'',
    'Purchase Price':'',
    'Purchase Unit':x.suggested_unit||'g',
    'Consumption Unit':x.suggested_unit||'g',
    'Conversion Quantity':1,
    'Wastage %':0,
    'Recipe':x.recipe||'',
    'Skip Reason':x.reason||''
  }));
  if(rows.length) downloadCSV('missing_recipe_ingredients_to_add_first.csv', rows);
}
async function importRecipeIngredientsCSV(input){
  const file=input.files?.[0]; if(!file) return;
  const activeRecipe=recipeActive();
  let rows=[];
  try{
    rows=await readRecipeIngredientImportRows(file);
  }catch(error){
    recipeShowError(error.message || 'Could not read recipe ingredient file.');
    input.value='';
    return;
  }
  if(!rows.length){ recipeShowWarning('No usable recipe ingredient rows found.'); input.value=''; return; }

  let inserted=0, updated=0, skipped=0;
  const issues=[];
  const localItemsByRecipe=new Map();
  const getLocalItems=(recipeId)=>{
    if(!localItemsByRecipe.has(recipeId)) localItemsByRecipe.set(recipeId,[...recipeItemsFor(recipeId)]);
    return localItemsByRecipe.get(recipeId);
  };

  for(const row of rows){
    const recipe=recipeImportResolveRecipe(row, activeRecipe);
    const recipeName=String(recipeImportPick(row,['recipe_name','recipe','recipe name','name'])||activeRecipe?.name||'').trim();
    const ingredientName=String(recipeImportPick(row,['ingredient_name','ingredient','ingredient name','item_name','item name','raw_material','raw material','material','material_name'])||'').trim();

    if(!recipe){ skipped++; issues.push(recipeImportIssue(row, recipeName, recipeName ? `Recipe not found: ${recipeName}` : 'Missing recipe name and no active recipe selected',{recipe:recipeName})); continue; }
    if(!ingredientName){ skipped++; issues.push(recipeImportIssue(row, recipe.name, 'Missing ingredient name',{recipe:recipe.name})); continue; }

    const ing=(state.ingredients||[]).find(i=>String(i.name||'').trim().toLowerCase()===ingredientName.toLowerCase());
    if(!ing){
      const suggestedUnit=String(recipeImportPick(row,['unit','uom','consumption_unit','consumption unit']) || recipe.yield_unit || recipe.main_ingredient_unit || 'g').trim();
      skipped++;
      issues.push(recipeImportIssue(row, ingredientName, `Ingredient not found in Ingredient Master: ${ingredientName}`,{
        type:'missing_ingredient',
        recipe:recipe.name,
        ingredient:ingredientName,
        suggested_unit:suggestedUnit
      }));
      continue;
    }

    const percentRaw=recipeImportPick(row,['percent_of_main_ingredient','% of main ingredient','percent main ingredient','main ingredient percent','main_percent','percent','percentage','pct','%','of_main_ingredient']);
    let pct=recipeImportPercent(percentRaw);
    const qtyRaw=recipeImportPick(row,['quantity_per_batch','qty_per_batch','quantity used','quantity_used','quantity','qty','quantity in gm','quantity_in_gm','qty in gm','qty_in_gm','grams','gram','gm']);
    let qty=recipeImportNumber(qtyRaw);
    const shouldUsePercent=recipeShouldUsePercent(recipe) || pct>0;
    const mainQty=recipeMainQty(recipe);

    if(shouldUsePercent && pct>0 && mainQty>0){
      qty=mainQty*pct/100;
    }else if(shouldUsePercent && !pct && qty>0 && mainQty>0){
      pct=recipePercentFromQty(qty,mainQty);
    }else if(shouldUsePercent && pct>0 && !mainQty){
      skipped++; issues.push(recipeImportIssue(row, ingredientName, `Cannot calculate quantity from ${pct}% because recipe "${recipe.name}" has no main ingredient quantity.`,{recipe:recipe.name})); continue;
    }

    if(qty<=0){ skipped++; issues.push(recipeImportIssue(row, ingredientName, 'Missing quantity or percentage',{recipe:recipe.name})); continue; }

    const unit=String(recipeImportPick(row,['unit','uom','consumption_unit','consumption unit']) || ing.consumption_unit || recipe.yield_unit || recipe.main_ingredient_unit || 'g').trim();
    const waste=recipeImportNumber(recipeImportPick(row,['waste_percent','waste %','waste','recipe_waste_percent','recipe waste %']));
    const stock=recipeImportNumber(recipeImportPick(row,['stock_available','stock available','available_stock','available stock','stock']));
    const localItems=getLocalItems(recipe.id);
    const existing=localItems.find(item=>item.ingredient_id===ing.id);
    const payload={
      recipe_id:recipe.id,
      ingredient_id:ing.id,
      quantity:qty,
      unit,
      waste_percent:waste,
      percent_of_main_ingredient:pct || null,
      calculated_quantity:qty,
      quantity_entry_mode:pct ? 'percentage' : 'direct',
      stock_available:stock || null,
      updated_at:new Date().toISOString()
    };

    let saved=null;
    if(existing?.id){
      saved=await dbUpdate('recipe_items',existing.id,payload);
      if(saved){ updated++; Object.assign(existing,saved); }
      else { skipped++; issues.push(recipeImportIssue(row, ingredientName, 'Database update failed',{recipe:recipe.name})); }
    }else{
      payload.sort_order=nextRecipeItemSortOrder(recipe.id)+localItems.filter(x=>!x.id).length;
      saved=await dbInsert('recipe_items',payload);
      if(saved){ inserted++; localItems.push(saved); }
      else { skipped++; issues.push(recipeImportIssue(row, ingredientName, 'Database insert failed',{recipe:recipe.name})); }
    }
  }

  recipeRenderIngredientImportResults({inserted,updated,skipped,issues});
  recipeShowToast(`Recipe ingredient import complete. Inserted ${inserted}, updated ${updated}, skipped ${skipped}.`);
  if(issues.length) console.warn('Recipe ingredient import skipped rows', issues);
  await refreshAll(false);
  const affectedRecipeIds=[...new Set((state.recipeItems||[]).map(x=>x.recipe_id))];
  for(const recipeId of affectedRecipeIds){ await syncRecipeAutoYield(recipeId); }
  await refreshAll(false);
  renderRecipes();
  recipeRenderIngredientImportResults(recipeLastIngredientImportSummary);
  if(typeof renderProducts==='function') renderProducts();
  input.value='';
}



/* Recipe Import Cleanup V1.6 - robust header + ingredient import */
let recipeLastHeaderImportSummary=null;
let recipeLastHeaderImportIssues=[];
function recipeImportCleanText(v){ return String(v ?? '').trim(); }
function recipeImportNormText(v){ return recipeImportCleanText(v).toLowerCase().replace(/\s+/g,' '); }
function recipeImportBool(value, fallback=true){
  const text=recipeImportCleanText(value).toLowerCase();
  if(!text) return fallback;
  if(['false','inactive','no','n','0','disabled'].includes(text)) return false;
  if(['true','active','yes','y','1','enabled'].includes(text)) return true;
  return fallback;
}
function recipeImportModeValue(value){
  const text=recipeImportCleanText(value).toLowerCase();
  if(['percentage','percent','%','% of main ingredient','of main ingredient','main ingredient percentage'].includes(text)) return 'percentage';
  return 'direct';
}
function recipeImportFindRecipeByName(name){
  const key=recipeImportNormText(name);
  return (state.recipes||[]).find(r=>recipeImportNormText(r.name)===key) || null;
}
function recipeImportFindIngredientByName(name){
  const key=recipeImportNormText(name);
  return (state.ingredients||[]).find(i=>recipeImportNormText(i.name)===key) || null;
}
function recipeImportHeaderIssue(row, name, reason, extra={}){ return {row:row?._row||'', sheet:row?._sheetName||'', recipe:name||'', name:name||'', reason, ...extra}; }
function recipeHeaderImportResultHtml(){
  const result=recipeLastHeaderImportSummary;
  if(!result) return '';
  const issues=result.issues||[];
  const warnings=result.warnings||[];
  const issueRows=issues.slice(0,120).map(x=>`<tr><td>${recipeEscape(x.row||'')}</td><td>${recipeEscape(x.sheet||'')}</td><td>${recipeEscape(x.recipe||x.name||'')}</td><td>${recipeEscape(x.reason||'')}</td></tr>`);
  const warningRows=warnings.slice(0,80).map(x=>`<tr><td>${recipeEscape(x.row||'')}</td><td>${recipeEscape(x.sheet||'')}</td><td>${recipeEscape(x.recipe||x.name||'')}</td><td>${recipeEscape(x.reason||'')}</td></tr>`);
  return `<div class="recipe-import-result-card" style="margin:10px 0;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:12px">
    <div><strong>Recipe header import:</strong> ${result.inserted||0} inserted, ${result.updated||0} updated, ${result.skipped||0} skipped, ${warnings.length||0} warning(s).</div>
    ${warnings.length?`<div class="recipe-table-wrap" style="margin-top:10px">${table(['Row','Sheet','Recipe','Warning'],warningRows)}</div><button class="recipe-btn small" onclick="downloadRecipeHeaderImportWarnings()">Download header warnings</button>`:''}
    ${issues.length?`<div class="recipe-table-wrap" style="margin-top:10px">${table(['Row','Sheet','Recipe','Reason'],issueRows)}</div><button class="recipe-btn small" onclick="downloadRecipeHeaderImportIssues()">Download skipped headers</button>`:'<span class="positive-text"> No skipped header rows.</span>'}
  </div>`;
}
function recipeRenderHeaderImportResults(result){
  recipeLastHeaderImportSummary=result||null;
  recipeLastHeaderImportIssues=(result&&result.issues)||[];
  const target=recipeById('recipeHeaderImportResults');
  if(target) target.innerHTML=recipeHeaderImportResultHtml();
}
function downloadRecipeHeaderImportIssues(){
  const rows=(recipeLastHeaderImportIssues||[]).map(x=>({'Row':x.row||'', 'Sheet':x.sheet||'', 'Recipe':x.recipe||x.name||'', 'Reason':x.reason||''}));
  if(rows.length) downloadCSV('recipe_header_import_skipped_reasons.csv', rows);
}
function downloadRecipeHeaderImportWarnings(){
  const rows=((recipeLastHeaderImportSummary&&recipeLastHeaderImportSummary.warnings)||[]).map(x=>({'Row':x.row||'', 'Sheet':x.sheet||'', 'Recipe':x.recipe||x.name||'', 'Warning':x.reason||''}));
  if(rows.length) downloadCSV('recipe_header_import_warnings.csv', rows);
}
function downloadRecipeHeaderImportTemplate(){
  downloadCSV('khumbuka_recipe_headers_template.csv',[
    {'Recipe Name':'Veg Momo Filling','Category':'Filling','Calculation Mode':'% of Main Ingredient','Main Ingredient':'Cabbage','Main Ingredient Quantity':1000,'Main Unit':'g','Yield Unit':'g','Filling / Momo':30,'Wrapper / Momo':'','Full Plate Pieces':8,'Half Plate Pieces':4,'Notes':'Veg filling batch','Active':true},
    {'Recipe Name':'Ragi Wrapper','Category':'Dough','Calculation Mode':'Direct Quantity','Main Ingredient':'','Main Ingredient Quantity':'','Main Unit':'g','Yield Unit':'g','Filling / Momo':'','Wrapper / Momo':13,'Full Plate Pieces':'','Half Plate Pieces':'','Notes':'Ragi wrapper dough','Active':true},
    {'Recipe Name':'Red Chilli Chutney','Category':'Chutney','Calculation Mode':'Direct Quantity','Main Ingredient':'','Main Ingredient Quantity':'','Main Unit':'g','Yield Unit':'g','Filling / Momo':'','Wrapper / Momo':'','Full Plate Pieces':'','Half Plate Pieces':'','Notes':'Chutney recipe','Active':true}
  ]);
}
function downloadRecipeIngredientImportTemplate(){
  downloadCSV('khumbuka_recipe_ingredients_template.csv',[
    {'Recipe Name':'Veg Momo Filling','Ingredient Name':'Cabbage','Quantity per Batch':1000,'% of Main Ingredient':100,'Unit':'g','Waste %':0,'Stock Available':'','Sort Order':1},
    {'Recipe Name':'Veg Momo Filling','Ingredient Name':'Carrot','Quantity per Batch':300,'% of Main Ingredient':30,'Unit':'g','Waste %':0,'Stock Available':'','Sort Order':2},
    {'Recipe Name':'Veg Momo Filling','Ingredient Name':'Onion','Quantity per Batch':300,'% of Main Ingredient':30,'Unit':'g','Waste %':0,'Stock Available':'','Sort Order':3}
  ]);
}
async function readRecipeImportRows(file){
  const name=String(file?.name||'').toLowerCase();
  if(name.endsWith('.csv')) return parseRecipeCsv(await file.text()).map(recipeNormalizeImportRow);
  if(typeof XLSX !== 'undefined'){
    const buffer=await file.arrayBuffer();
    const workbook=XLSX.read(buffer,{type:'array'});
    const rows=[];
    workbook.SheetNames.forEach(sheetName=>{
      const sheet=workbook.Sheets[sheetName];
      const data=XLSX.utils.sheet_to_json(sheet,{defval:''});
      data.forEach((row,idx)=>rows.push(recipeNormalizeImportRow(row, idx+2, sheetName)));
    });
    return rows;
  }
  if(typeof readSheetFile === 'function'){
    const data=await readSheetFile(file,{allSheets:true});
    return (data||[]).map((row,idx)=>recipeNormalizeImportRow(row,row.__rowNumber||idx+2,row.__sheetName||''));
  }
  throw new Error('Excel import needs XLSX library. Please upload CSV or make sure xlsx library is loaded.');
}
function recipeHeaderPayloadFromRow(row, existing=null){
  const name=recipeImportCleanText(recipeImportPick(row,['recipe_name','recipe name','recipe','name']));
  const category=recipeImportCleanText(recipeImportPick(row,['category','recipe_category','recipe category'])) || existing?.category || 'Other';
  const mode=recipeImportModeValue(recipeImportPick(row,['calculation_mode','calculation mode','mode','recipe mode','costing mode']));
  const mainIngredientName=recipeImportCleanText(recipeImportPick(row,['main_ingredient','main ingredient','base ingredient','main ingredient name']));
  const mainIngredient=mainIngredientName ? recipeImportFindIngredientByName(mainIngredientName) : null;
  const mainQty=recipeImportNumber(recipeImportPick(row,['main_ingredient_quantity','main ingredient quantity','main ingredient qty','main qty','base quantity','base qty']));
  const mainUnit=recipeImportCleanText(recipeImportPick(row,['main_ingredient_unit','main ingredient unit','main unit','base unit'])) || existing?.main_ingredient_unit || existing?.yield_unit || 'g';
  const yieldQty=recipeImportNumber(recipeImportPick(row,['yield_quantity','yield quantity','yield qty','yield']));
  const yieldUnit=recipeImportCleanText(recipeImportPick(row,['yield_unit','yield unit','unit'])) || existing?.yield_unit || mainUnit || 'g';
  const filling=recipeImportNumber(recipeImportPick(row,['filling_grams_per_momo','filling grams per momo','filling / momo','filling per momo','grams per momo','g per momo']));
  const wrapper=recipeImportNumber(recipeImportPick(row,['wrapper_grams_per_momo','wrapper grams per momo','wrapper / momo','wrapper per momo','wrapper g per momo']));
  const fullPieces=recipeImportNumber(recipeImportPick(row,['full_plate_pieces','full plate pieces','full pieces']));
  const halfPieces=recipeImportNumber(recipeImportPick(row,['half_plate_pieces','half plate pieces','half pieces']));
  const wrapperCost=recipeImportNumber(recipeImportPick(row,['wrapper_cost_per_momo','wrapper cost per momo']));
  const fullExtra=recipeImportNumber(recipeImportPick(row,['full_plate_extra_cost','full plate extra cost']));
  const halfExtra=recipeImportNumber(recipeImportPick(row,['half_plate_extra_cost','half plate extra cost']));
  const notes=recipeImportCleanText(recipeImportPick(row,['notes','note','description'])) || existing?.notes || '';
  const active=recipeImportBool(recipeImportPick(row,['active','status','enabled']), existing ? existing.active!==false : true);
  const payload={name,category,calculation_mode:mode,yield_unit:yieldUnit,notes,active,updated_at:new Date().toISOString()};
  if(yieldQty>0) payload.yield_quantity=yieldQty;
  if(mainIngredient?.id) payload.main_ingredient_id=mainIngredient.id;
  else if(!mainIngredientName && existing?.main_ingredient_id) payload.main_ingredient_id=existing.main_ingredient_id;
  if(mainQty>0) payload.main_ingredient_quantity=mainQty;
  if(mainUnit) payload.main_ingredient_unit=mainUnit;
  if(filling>0) payload.filling_grams_per_momo=filling;
  if(wrapper>0) payload.wrapper_grams_per_momo=wrapper;
  if(fullPieces>0) payload.full_plate_pieces=fullPieces;
  if(halfPieces>0) payload.half_plate_pieces=halfPieces;
  if(wrapperCost>0) payload.wrapper_cost_per_momo=wrapperCost;
  if(fullExtra>0) payload.full_plate_extra_cost=fullExtra;
  if(halfExtra>0) payload.half_plate_extra_cost=halfExtra;
  return {payload, mainIngredientName, mainIngredient};
}
window.importRecipeHeadersFile = async function(input){
  const file=input.files?.[0]; if(!file) return;
  let rows=[];
  try{ rows=await readRecipeImportRows(file); }
  catch(error){ recipeShowError(error.message || 'Could not read recipe header file.'); input.value=''; return; }
  if(!rows.length){ recipeShowWarning('No recipe header rows found.'); input.value=''; return; }
  let inserted=0, updated=0, skipped=0;
  const issues=[], warnings=[], seen=new Set();
  const localRecipes=[...(state.recipes||[])];
  for(const row of rows){
    const name=recipeImportCleanText(recipeImportPick(row,['recipe_name','recipe name','recipe','name']));
    if(!name){ skipped++; issues.push(recipeImportHeaderIssue(row,'','Missing recipe name')); continue; }
    const key=recipeImportNormText(name);
    if(seen.has(key)){ skipped++; issues.push(recipeImportHeaderIssue(row,name,'Duplicate recipe row in uploaded sheet')); continue; }
    seen.add(key);
    const existing=localRecipes.find(r=>recipeImportNormText(r.name)===key) || null;
    const {payload, mainIngredientName, mainIngredient}=recipeHeaderPayloadFromRow(row, existing);
    if(!payload.name){ skipped++; issues.push(recipeImportHeaderIssue(row,name,'Missing recipe name')); continue; }
    if(recipeShouldUsePercent(payload) && mainIngredientName && !mainIngredient){ skipped++; issues.push(recipeImportHeaderIssue(row,name,`Main ingredient not found in Ingredient Master: ${mainIngredientName}`)); continue; }
    if(recipeShouldUsePercent(payload) && !payload.main_ingredient_quantity){ warnings.push(recipeImportHeaderIssue(row,name,'Percentage recipe has no main ingredient quantity. Ingredient % rows cannot calculate quantity until this is filled.')); }
    let saved=null;
    if(existing?.id){
      saved=await dbUpdate('recipes', existing.id, payload);
      if(saved){ updated++; Object.assign(existing,saved); }
      else { skipped++; issues.push(recipeImportHeaderIssue(row,name,'Database update failed')); }
    }else{
      saved=await dbInsert('recipes', payload);
      if(saved){ inserted++; localRecipes.push(saved); }
      else { skipped++; issues.push(recipeImportHeaderIssue(row,name,'Database insert failed')); }
    }
  }
  recipeRenderHeaderImportResults({inserted,updated,skipped,issues,warnings});
  recipeShowToast(`Recipe header import complete. Inserted ${inserted}, updated ${updated}, skipped ${skipped}.`);
  await refreshAll(false);
  renderRecipes();
  recipeRenderHeaderImportResults(recipeLastHeaderImportSummary);
  input.value='';
};
function recipeIngredientImportResultHtml(){
  const result=recipeLastIngredientImportSummary;
  if(!result) return '';
  const issues=result.issues||[];
  const warnings=result.warnings||[];
  const missing=issues.filter(x=>x.type==='missing_ingredient');
  const issueRows=issues.slice(0,140).map(x=>`<tr><td>${recipeEscape(x.row||'')}</td><td>${recipeEscape(x.sheet||'')}</td><td>${recipeEscape(x.recipe||'')}</td><td>${recipeEscape(x.name||x.ingredient||'')}</td><td>${recipeEscape(x.reason||'')}</td></tr>`);
  const warningRows=warnings.slice(0,100).map(x=>`<tr><td>${recipeEscape(x.row||'')}</td><td>${recipeEscape(x.sheet||'')}</td><td>${recipeEscape(x.recipe||'')}</td><td>${recipeEscape(x.name||x.ingredient||'')}</td><td>${recipeEscape(x.reason||'')}</td></tr>`);
  const missingRows=missing.slice(0,80).map(x=>`<tr><td>${recipeEscape(x.recipe||'')}</td><td>${recipeEscape(x.ingredient||x.name||'')}</td><td>${recipeEscape(x.suggested_unit||'g')}</td><td>${recipeEscape(x.reason||'')}</td></tr>`);
  return `<div class="recipe-import-result-card" style="margin:10px 0;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:12px">
    <div><strong>Recipe ingredient import:</strong> ${result.inserted||0} inserted, ${result.updated||0} updated, ${result.deleted||0} deleted/replaced, ${result.skipped||0} skipped, ${warnings.length||0} warning(s).</div>
    ${missing.length?`<div class="recipe-warning-list" style="margin-top:10px"><strong>${missing.length} missing ingredient${missing.length>1?'s':''} found:</strong><span>Add/import these ingredients in Ingredient Master first, then import this recipe sheet again.</span></div><div class="recipe-table-wrap" style="margin-top:10px">${table(['Recipe','Missing Ingredient','Suggested Unit','Reason'],missingRows)}</div><button class="recipe-btn small" onclick="downloadRecipeImportMissingIngredients()">Download missing ingredients</button>`:''}
    ${warnings.length?`<div class="recipe-table-wrap" style="margin-top:10px">${table(['Row','Sheet','Recipe','Name','Warning'],warningRows)}</div><button class="recipe-btn small" onclick="downloadRecipeIngredientImportWarnings()">Download warnings</button>`:''}
    ${issues.length?`<div class="recipe-table-wrap" style="margin-top:10px">${table(['Row','Sheet','Recipe','Name','Reason'],issueRows)}</div><button class="recipe-btn small" onclick="downloadRecipeIngredientImportIssues()">Download skipped reasons</button>`:'<span class="positive-text"> No skipped rows.</span>'}
  </div>`;
}
function downloadRecipeIngredientImportWarnings(){
  const rows=((recipeLastIngredientImportSummary&&recipeLastIngredientImportSummary.warnings)||[]).map(x=>({'Row':x.row||'', 'Sheet':x.sheet||'', 'Recipe':x.recipe||'', 'Name':x.name||x.ingredient||'', 'Warning':x.reason||''}));
  if(rows.length) downloadCSV('recipe_ingredient_import_warnings.csv', rows);
}
window.importRecipeIngredientsCSV = async function(input){
  const file=input.files?.[0]; if(!file) return;
  const mode=recipeVal('recipeIngredientImportMode') || 'upsert';
  const activeRecipe=recipeActive();
  let rows=[];
  try{ rows=await readRecipeImportRows(file); }
  catch(error){ recipeShowError(error.message || 'Could not read recipe ingredient file.'); input.value=''; return; }
  if(!rows.length){ recipeShowWarning('No usable recipe ingredient rows found.'); input.value=''; return; }
  let inserted=0, updated=0, skipped=0, deleted=0;
  const issues=[], warnings=[], seen=new Set();
  let recipesForImport=[];
  const resolveRecipe=(row)=>{
    const recipeName=recipeImportCleanText(recipeImportPick(row,['recipe_name','recipe name','recipe','name']));
    if(recipeName) return recipeImportFindRecipeByName(recipeName);
    return activeRecipe || null;
  };
  if(mode==='replace'){
    const ids=new Set();
    for(const row of rows){ const r=resolveRecipe(row); if(r?.id) ids.add(r.id); }
    for(const recipeId of ids){
      const existing=recipeItemsFor(recipeId);
      for(const item of existing){ const ok=await dbDelete('recipe_items', item.id); if(ok) deleted++; }
    }
    if(ids.size) await refreshAll(false);
  }
  const localItemsByRecipe=new Map();
  const getLocalItems=(recipeId)=>{
    if(!localItemsByRecipe.has(recipeId)) localItemsByRecipe.set(recipeId, mode==='replace' ? [] : [...recipeItemsFor(recipeId)]);
    return localItemsByRecipe.get(recipeId);
  };
  for(const row of rows){
    const recipe=resolveRecipe(row);
    const recipeName=recipeImportCleanText(recipeImportPick(row,['recipe_name','recipe name','recipe','name']) || activeRecipe?.name || '');
    const ingredientName=recipeImportCleanText(recipeImportPick(row,['ingredient_name','ingredient name','ingredient','item_name','item name','item','raw_material','raw material','material','material_name']));
    if(!recipe){ skipped++; issues.push(recipeImportIssue(row, recipeName, recipeName ? `Recipe not found: ${recipeName}` : 'Missing recipe name and no active recipe selected',{recipe:recipeName})); continue; }
    if(!ingredientName){ skipped++; issues.push(recipeImportIssue(row, recipe.name, 'Missing ingredient name',{recipe:recipe.name})); continue; }
    const ing=recipeImportFindIngredientByName(ingredientName);
    if(!ing){
      const suggestedUnit=recipeImportCleanText(recipeImportPick(row,['unit','uom','consumption_unit','consumption unit']) || recipe.yield_unit || recipe.main_ingredient_unit || 'g');
      skipped++;
      issues.push(recipeImportIssue(row, ingredientName, `Ingredient not found in Ingredient Master: ${ingredientName}`,{type:'missing_ingredient',recipe:recipe.name,ingredient:ingredientName,suggested_unit:suggestedUnit}));
      continue;
    }
    const dupKey=`${recipe.id}|${ing.id}`;
    if(seen.has(dupKey)){ skipped++; issues.push(recipeImportIssue(row, ingredientName, 'Duplicate row in uploaded sheet for this Recipe + Ingredient',{recipe:recipe.name})); continue; }
    seen.add(dupKey);
    const percentRaw=recipeImportPick(row,['percent_of_main_ingredient','% of main ingredient','percent main ingredient','main ingredient percent','main_percent','main percent','percent','percentage','pct','%','of_main_ingredient']);
    let pct=recipeImportPercent(percentRaw);
    const qtyRaw=recipeImportPick(row,['quantity_per_batch','quantity per batch','qty_per_batch','batch qty','batch quantity','quantity used','quantity_used','quantity','qty','quantity in gm','quantity_in_gm','qty in gm','qty_in_gm','grams','gram','gm']);
    let qty=recipeImportNumber(qtyRaw);
    const shouldUsePercent=recipeShouldUsePercent(recipe) || pct>0;
    const mainQty=recipeMainQty(recipe);
    const isMain=String(ing.id)===String(recipe.main_ingredient_id);
    if(shouldUsePercent && isMain && pct<=0) pct=100;
    if(shouldUsePercent && qty>0 && pct>0 && mainQty>0){
      const expected=mainQty*pct/100;
      if(Math.abs(expected-qty)>0.01){
        warnings.push(recipeImportIssue(row, ingredientName, `Quantity and % do not match. Imported quantity used and % recalculated from quantity. Sheet %: ${pct}, expected qty: ${recipeFormatRecipeNumber(expected)}, imported qty: ${recipeFormatRecipeNumber(qty)}.`,{recipe:recipe.name}));
        pct=recipePercentFromQty(qty,mainQty);
      }
    }else if(shouldUsePercent && pct>0 && mainQty>0){
      qty=mainQty*pct/100;
    }else if(shouldUsePercent && !pct && qty>0 && mainQty>0){
      pct=recipePercentFromQty(qty,mainQty);
    }else if(shouldUsePercent && pct>0 && !mainQty){
      skipped++; issues.push(recipeImportIssue(row, ingredientName, `Cannot calculate quantity from ${pct}% because recipe "${recipe.name}" has no main ingredient quantity.`,{recipe:recipe.name})); continue;
    }
    if(qty<=0){ skipped++; issues.push(recipeImportIssue(row, ingredientName, 'Missing quantity and missing %',{recipe:recipe.name})); continue; }
    const unit=recipeImportCleanText(recipeImportPick(row,['unit','uom','consumption_unit','consumption unit']) || ing.consumption_unit || recipe.yield_unit || recipe.main_ingredient_unit || 'g');
    if(unit && ing.consumption_unit && recipeUnitFamily(unit)!==recipeUnitFamily(ing.consumption_unit)){
      warnings.push(recipeImportIssue(row, ingredientName, `Unit family may not match Ingredient Master. Import unit: ${unit}, ingredient consumption unit: ${ing.consumption_unit}.`,{recipe:recipe.name}));
    }
    const waste=recipeImportNumber(recipeImportPick(row,['waste_percent','waste %','waste','recipe_waste_percent','recipe waste %']));
    const stock=recipeImportNumber(recipeImportPick(row,['stock_available','stock available','available_stock','available stock','stock']));
    const sortOrder=recipeImportNumber(recipeImportPick(row,['sort_order','sort order','order','priority','sequence','seq']));
    const localItems=getLocalItems(recipe.id);
    const existing=localItems.find(item=>String(item.ingredient_id)===String(ing.id));
    const payload={recipe_id:recipe.id,ingredient_id:ing.id,quantity:qty,unit,waste_percent:waste,percent_of_main_ingredient:pct||null,calculated_quantity:qty,quantity_entry_mode:pct?'percentage':'direct',stock_available:stock||null,updated_at:new Date().toISOString()};
    if(sortOrder>0) payload.sort_order=sortOrder;
    let saved=null;
    if(existing?.id){
      saved=await dbUpdate('recipe_items', existing.id, payload);
      if(saved){ updated++; Object.assign(existing,saved); }
      else { skipped++; issues.push(recipeImportIssue(row, ingredientName, 'Database update failed',{recipe:recipe.name})); }
    }else{
      payload.sort_order = payload.sort_order || (nextRecipeItemSortOrder(recipe.id)+localItems.filter(x=>!x.id).length);
      saved=await dbInsert('recipe_items', payload);
      if(saved){ inserted++; localItems.push(saved); }
      else { skipped++; issues.push(recipeImportIssue(row, ingredientName, 'Database insert failed',{recipe:recipe.name})); }
    }
  }
  recipeRenderIngredientImportResults({inserted,updated,deleted,skipped,issues,warnings,mode});
  recipeShowToast(`Recipe ingredient import complete. Inserted ${inserted}, updated ${updated}, skipped ${skipped}.`);
  await refreshAll(false);
  const affectedRecipeIds=[...new Set([...(state.recipeItems||[]).map(x=>x.recipe_id)])];
  for(const recipeId of affectedRecipeIds){ await syncRecipeAutoYield(recipeId); }
  await refreshAll(false);
  renderRecipes();
  recipeRenderHeaderImportResults(recipeLastHeaderImportSummary);
  recipeRenderIngredientImportResults(recipeLastIngredientImportSummary);
  if(typeof renderProducts==='function') renderProducts();
  input.value='';
};
